import os
import streamlit as st
from langchain_community.document_loaders import UnstructuredURLLoader
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_huggingface import HuggingFaceEmbeddings
from langchain.vectorstores import FAISS
from langchain_huggingface import HuggingFaceEndpoint
from langchain_core.prompts import PromptTemplate
from langchain_core.runnables import RunnableLambda, RunnablePassthrough
from langchain_core.output_parsers import StrOutputParser

# Streamlit callback handler for streaming output
class StreamHandler:
    def __init__(self, container, initial_text=""):
        self.container = container
        self.text = initial_text
        
    def on_llm_new_token(self, token: str, **kwargs) -> None:
        self.text += token
        self.container.markdown(self.text)

# Main function to load the Streamlit app
def main():
    # Set page configuration
    st.set_page_config(
        page_title="News Research Tool",
        page_icon="📰",
        layout="wide"
    )
    
    # Add custom CSS
    st.markdown("""
    <style>
    .main-header {
        font-size: 2.5rem;
        color: #1E88E5;
        text-align: center;
        margin-bottom: 1rem;
    }
    .subheader {
        font-size: 1.5rem;
        color: #424242;
        margin-bottom: 1rem;
    }
    .stButton>button {
        background-color: #1E88E5;
        color: white;
        border-radius: 5px;
        padding: 0.5rem 1rem;
        font-size: 1rem;
        font-weight: bold;
    }
    .stTextInput>div>div>input {
        border-radius: 5px;
    }
    .result-container {
        background-color: #f5f5f5;
        padding: 1.5rem;
        border-radius: 10px;
        margin-top: 1rem;
    }
    .source-container {
        background-color: #e3f2fd;
        padding: 1rem;
        border-radius: 5px;
        margin-top: 0.5rem;
        font-size: 0.9rem;
    }
    </style>
    """, unsafe_allow_html=True)
    
    # Header with icon
    col1, col2, col3 = st.columns([1, 3, 1])
    with col2:
        st.markdown('<div class="main-header">📰 News Research Tool</div>', unsafe_allow_html=True)
        st.markdown('<div class="subheader">Extract insights from any news article or website</div>', unsafe_allow_html=True)
    
    # Initialize session state variables
    if 'urls' not in st.session_state:
        st.session_state.urls = []
    if 'processed_data' not in st.session_state:
        st.session_state.processed_data = False
    if 'faiss_index' not in st.session_state:
        st.session_state.faiss_index = None
    if 'sources' not in st.session_state:
        st.session_state.sources = []
    
    # URL input section
    st.markdown("### Enter URLs to analyze")
    url_input = st.text_area("Enter URLs (one per line)", height=100, 
                            placeholder="https://example.com/article1\nhttps://example.com/article2")
    
    col1, col2 = st.columns([1, 5])
    with col1:
        process_url_clicked = st.button("Process URLs", use_container_width=True)
    
    # Process URLs when button is clicked
    if process_url_clicked and url_input:
        with st.spinner("Processing URLs... This may take a minute."):
            # Clear previous data
            st.session_state.processed_data = False
            st.session_state.faiss_index = None
            
            # Get URLs from input
            urls = [url.strip() for url in url_input.split("\n") if url.strip()]
            st.session_state.urls = urls
            
            try:
                # Load data from URLs
                loader = UnstructuredURLLoader(urls=urls)
                data = loader.load()
                
                # Store sources for citation
                st.session_state.sources = [doc.metadata['source'] for doc in data]
                
                # Split text into chunks
                text_splitter = RecursiveCharacterTextSplitter(
                    chunk_size=1000,
                    chunk_overlap=200
                )
                docs = text_splitter.split_documents(data)
                
                # Create embeddings
                embeddings = HuggingFaceEmbeddings(
                    model_name="sentence-transformers/all-mpnet-base-v2"
                )
                
                # Create FAISS index
                vectorstore = FAISS.from_documents(docs, embeddings)
                st.session_state.faiss_index = vectorstore
                st.session_state.processed_data = True
                
                st.success(f"Successfully processed {len(urls)} URLs and created {len(docs)} text chunks.")
            except Exception as e:
                st.error(f"Error processing URLs: {str(e)}")
    
    # Query section
    st.markdown("### Ask questions about the articles")
    query = st.text_input("Enter your question:")
    
    col1, col2 = st.columns([1, 5])
    with col1:
        search_clicked = st.button("Search", use_container_width=True)
    
    # Display results
    if search_clicked and query and st.session_state.processed_data:
        try:
            with st.spinner("Searching for answers..."):
                # Create a container for streaming output
                answer_container = st.empty()
                stream_handler = StreamHandler(answer_container)
                
                # Initialize LLM
                llm = HuggingFaceEndpoint(
                    repo_id="mistralai/Mistral-7B-Instruct-v0.2",
                    temperature=0.5,
                    max_length=512,
                    streaming=True,
                    callbacks=[stream_handler]
                )
                
                # Create prompt template
                prompt_template = """
                Answer the following question based ONLY on the provided context. If you don't know the answer, say "I don't have enough information to answer this question." Do not make up information.
                
                Context: {context}
                
                Question: {question}
                
                Answer:
                """
                
                PROMPT = PromptTemplate(
                    template=prompt_template,
                    input_variables=["context", "question"]
                )
                
                # Create retrieval chain
                retriever = st.session_state.faiss_index.as_retriever(search_kwargs={"k": 5})
                
                # Function to format documents
                def format_docs(docs):
                    return "\n\n".join(doc.page_content for doc in docs)
                
                # Create the chain
                rag_chain = (
                    {"context": retriever | RunnableLambda(format_docs), "question": RunnablePassthrough()}
                    | PROMPT
                    | llm
                    | StrOutputParser()
                )
                
                # Get relevant documents for citation
                docs = retriever.get_relevant_documents(query)
                sources = [doc.metadata['source'] for doc in docs]
                unique_sources = list(set(sources))
                
                # Run the chain
                response = rag_chain.invoke(query)
                
                # Display sources
                st.markdown("#### Sources:")
                for i, source in enumerate(unique_sources):
                    st.markdown(f"- [{source}]({source})")
                
        except Exception as e:
            st.error(f"Error processing your question: {str(e)}")
    
    elif search_clicked and not st.session_state.processed_data:
        st.warning("Please process some URLs before asking questions.")
    
    # Footer
    st.markdown("---")
    st.markdown("Built with Streamlit and LangChain")

if __name__ == "__main__":
    main()