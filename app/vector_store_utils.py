import os, io, glob, json, asyncio
import pdfplumber, pytesseract
from PIL import Image
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_core.documents import Document
from langchain_community.vectorstores import FAISS
import logging

BASE_COMPANY_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), "companies")
BASE_VECTOR_DIR = "vector_store"

logger = logging.getLogger(__name__)

def load_processed_files(vector_path: str):
    """Load the set of processed files from JSON"""
    processed_file_path = os.path.join(vector_path, "processed_files.json")
    if os.path.exists(processed_file_path):
        with open(processed_file_path, "r", encoding="utf-8") as f:
            return set(json.load(f))
    return set()

def save_processed_files(vector_path: str, processed_files):
    """Save the set of processed files to JSON"""
    processed_file_path = os.path.join(vector_path, "processed_files.json")
    with open(processed_file_path, "w", encoding="utf-8") as f:
        json.dump(list(processed_files), f, ensure_ascii=False, indent=2)

def extract_text_from_pdf(pdf_path, use_ocr=False):
    text_chunks = []
    with pdfplumber.open(pdf_path) as pdf:
        for page_num, page in enumerate(pdf.pages, start=1):
            text = page.extract_text() or ""
            if use_ocr:
                for img in page.images:
                    x0, top, x1, bottom = img["x0"], img["top"], img["x1"], img["bottom"]
                    image = page.crop((x0, top, x1, bottom)).to_image(resolution=300)
                    img_bytes = io.BytesIO()
                    image.save(img_bytes, format="PNG")
                    img_bytes.seek(0)
                    ocr_text = pytesseract.image_to_string(Image.open(img_bytes), lang="jpn+eng")
                    text += "\n[OCR DIAGRAM TEXT]: " + ocr_text
            if text.strip():
                text_chunks.append((text, page_num, os.path.basename(pdf_path)))
    return text_chunks

def split_text_into_documents(text_chunks):
    splitter = RecursiveCharacterTextSplitter(chunk_size=1000, chunk_overlap=100)
    docs = []
    for text, page_num, filename in text_chunks:
        for chunk in splitter.split_text(text):
            docs.append(Document(page_content=chunk, metadata={"page": page_num, "source": filename}))
    return docs

def is_valid_vector_store(vector_store):
    """Check if vector store is valid and has documents"""
    if not vector_store:
        return False
    if not hasattr(vector_store, 'index_to_docstore_id'):
        return False
    if len(vector_store.index_to_docstore_id) == 0:
        return False
    return True

def get_vector_store_document_count(vector_store):
    """Get the number of documents in the vector store"""
    if not is_valid_vector_store(vector_store):
        return 0
    return len(vector_store.index_to_docstore_id)

async def build_or_update_vector_store(company_name, embeddings, use_ocr=False, rebuild=False):
    logger.info(f"Building/updating vector store for company: {company_name}")
    vector_path = os.path.join(BASE_VECTOR_DIR, company_name)
    company_pdf_dir = os.path.join(BASE_COMPANY_DIR, company_name)
    
    logger.info(f"Vector path: {vector_path}")
    logger.info(f"Company PDF directory: {company_pdf_dir}")
    logger.info(f"BASE_COMPANY_DIR: {BASE_COMPANY_DIR}")
    logger.info(f"BASE_VECTOR_DIR: {BASE_VECTOR_DIR}")
    
    try:
        os.makedirs(vector_path, exist_ok=True)
        logger.info(f"Created vector store directory: {vector_path}")
    except Exception as e:
        error_msg = f"Failed to create vector store directory: {e}"
        logger.error(error_msg)
        raise RuntimeError(error_msg)

    # Check if company directory exists and has PDFs
    if not os.path.exists(company_pdf_dir):
        error_msg = f"Company directory {company_pdf_dir} does not exist"
        logger.error(error_msg)
        raise FileNotFoundError(error_msg)
    
    pdf_files = glob.glob(os.path.join(company_pdf_dir, "*.pdf"))
    logger.info(f"Found {len(pdf_files)} PDF files in {company_pdf_dir}")
    logger.info(f"PDF files: {pdf_files}")
    if not pdf_files:
        error_msg = f"No PDF files found in {company_pdf_dir}"
        logger.error(error_msg)
        raise FileNotFoundError(error_msg)

    if rebuild or not os.path.exists(os.path.join(vector_path, "index.faiss")):
        logger.info(f"Building new vector store for {company_name}")
        all_chunks = []
        for pdf_path in pdf_files:
            try:
                logger.info(f"Processing PDF: {pdf_path}")
                chunks = await asyncio.to_thread(extract_text_from_pdf, pdf_path, use_ocr)
                logger.info(f"Extracted {len(chunks)} text chunks from {pdf_path}")
                all_chunks.extend(chunks)
            except Exception as e:
                logger.warning(f"Failed to process PDF {pdf_path}: {e}")
                continue
        
        if not all_chunks:
            error_msg = f"No text could be extracted from PDFs in {company_pdf_dir}"
            logger.error(error_msg)
            raise RuntimeError(error_msg)
        
        logger.info(f"Creating documents from {len(all_chunks)} text chunks")
        docs = await asyncio.to_thread(split_text_into_documents, all_chunks)
        if not docs:
            error_msg = f"No documents created from PDFs in {company_pdf_dir}"
            logger.error(error_msg)
            raise RuntimeError(error_msg)
        
        logger.info(f"Creating FAISS vector store with {len(docs)} documents")
        try:
            vector_store = FAISS.from_documents(docs, embeddings)
            logger.info("FAISS vector store created successfully")
            
            # Check what was created
            if vector_store and hasattr(vector_store, 'index_to_docstore_id'):
                logger.info(f"Vector store created with {len(vector_store.index_to_docstore_id)} documents")
            else:
                logger.warning("Vector store creation may have failed")
            
        except Exception as e:
            error_msg = f"Failed to create FAISS vector store: {e}"
            logger.error(error_msg)
            raise RuntimeError(error_msg)
        
        logger.info(f"Saving vector store to {vector_path}")
        try:
            vector_store.save_local(vector_path)
            logger.info("Vector store saved successfully")
        except Exception as e:
            error_msg = f"Failed to save vector store: {e}"
            logger.error(error_msg)
            raise RuntimeError(error_msg)
        
        save_processed_files(vector_path, {os.path.basename(p) for p in pdf_files})
        logger.info(f"Vector store build completed for {company_name}")
        return vector_store

    # Load existing vector store
    logger.info(f"Loading existing vector store from {vector_path}")
    if not os.path.exists(os.path.join(vector_path, "index.faiss")):
        error_msg = f"Vector store index not found at {vector_path}"
        logger.error(error_msg)
        raise FileNotFoundError(error_msg)
    
    try:
        vector_store = FAISS.load_local(vector_path, embeddings, allow_dangerous_deserialization=True)
        logger.info("Existing vector store loaded successfully")
        
        # Check what was loaded
        if vector_store and hasattr(vector_store, 'index_to_docstore_id'):
            logger.info(f"Vector store loaded with {len(vector_store.index_to_docstore_id)} documents")
        else:
            logger.warning("Vector store loading may have failed")
        
        # Check if it has a docstore
        if hasattr(vector_store, 'docstore'):
            logger.info(f"Has docstore: {vector_store.docstore is not None}")
            if vector_store.docstore:
                logger.info(f"Docstore type: {type(vector_store.docstore)}")
                if hasattr(vector_store.docstore, '_dict'):
                    logger.info(f"Docstore _dict length: {len(vector_store.docstore._dict)}")
        
    except Exception as e:
        error_msg = f"Failed to load existing vector store: {e}"
        logger.error(error_msg)
        raise RuntimeError(error_msg)
    
    processed_files = load_processed_files(vector_path)
    new_pdfs = [p for p in pdf_files if os.path.basename(p) not in processed_files]
    logger.info(f"Found {len(new_pdfs)} new PDFs to process")
    
    if not new_pdfs:
        # Validate existing vector store has documents
        if not is_valid_vector_store(vector_store):
            logger.warning(f"Existing vector store is empty. Rebuilding...")
            return await build_or_update_vector_store(company_name, embeddings, use_ocr, rebuild=True)
        logger.info(f"Vector store is up to date for {company_name}")
        return vector_store

    logger.info(f"Processing {len(new_pdfs)} new PDFs")
    new_docs = []
    for pdf_path in new_pdfs:
        try:
            logger.info(f"Processing new PDF: {pdf_path}")
            chunks = await asyncio.to_thread(extract_text_from_pdf, pdf_path, use_ocr)
            docs = await asyncio.to_thread(split_text_into_documents, chunks)
            new_docs.extend(docs)
            processed_files.add(os.path.basename(pdf_path))
            logger.info(f"Added {len(docs)} documents from {pdf_path}")
        except Exception as e:
            logger.warning(f"Failed to process new PDF {pdf_path}: {e}")
            continue

    if new_docs:
        logger.info(f"Adding {len(new_docs)} new documents to vector store")
        try:
            vector_store.add_documents(new_docs)
            logger.info("Documents added to vector store successfully")
        except Exception as e:
            error_msg = f"Failed to add documents to vector store: {e}"
            logger.error(error_msg)
            raise RuntimeError(error_msg)
        
        try:
            vector_store.save_local(vector_path)
            logger.info("Updated vector store saved successfully")
        except Exception as e:
            error_msg = f"Failed to save updated vector store: {e}"
            logger.error(error_msg)
            raise RuntimeError(error_msg)
        
        save_processed_files(vector_path, processed_files)
        logger.info(f"Vector store update completed for {company_name}")
    else:
        logger.warning(f"No new documents were successfully processed for {company_name}")
    
    return vector_store

async def delete_pdf_and_reindex(company_name, filename, embeddings, use_ocr=False):
    file_path = os.path.join(BASE_COMPANY_DIR, company_name, filename)
    if os.path.exists(file_path):
        os.remove(file_path)
    return await build_or_update_vector_store(company_name, embeddings, use_ocr, rebuild=True)
