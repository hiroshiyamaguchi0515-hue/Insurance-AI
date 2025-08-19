import os
import io
import glob
import json
import pytesseract
from PIL import Image
import pdfplumber
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_core.documents import Document
from langchain_community.vectorstores import FAISS

BASE_COMPANY_DIR = "companies"
BASE_VECTOR_DIR = "vector_store"

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

def load_processed_files(vector_path):
    processed_file_path = os.path.join(vector_path, "processed_files.json")
    if os.path.exists(processed_file_path):
        with open(processed_file_path, "r", encoding="utf-8") as f:
            return set(json.load(f))
    return set()

def save_processed_files(vector_path, processed_files):
    processed_file_path = os.path.join(vector_path, "processed_files.json")
    with open(processed_file_path, "w", encoding="utf-8") as f:
        json.dump(list(processed_files), f, ensure_ascii=False, indent=2)

def list_company_pdfs(company_name):
    company_pdf_dir = os.path.join(BASE_COMPANY_DIR, company_name)
    vector_path = os.path.join(BASE_VECTOR_DIR, company_name)
    all_pdfs = [os.path.basename(p) for p in glob.glob(os.path.join(company_pdf_dir, "*.pdf"))]
    processed = load_processed_files(vector_path)
    new_files = [f for f in all_pdfs if f not in processed]
    return {"processed": list(processed), "new": new_files}

def delete_pdf_and_reindex(company_name, filename, embeddings, use_ocr=False):
    company_pdf_dir = os.path.join(BASE_COMPANY_DIR, company_name)
    file_path = os.path.join(company_pdf_dir, filename)
    if os.path.exists(file_path):
        os.remove(file_path)
    # Rebuild index completely
    return build_or_update_vector_store(company_name, embeddings, use_ocr, rebuild=True)

def build_or_update_vector_store(company_name, embeddings, use_ocr=False, rebuild=False):
    vector_path = os.path.join(BASE_VECTOR_DIR, company_name)
    company_pdf_dir = os.path.join(BASE_COMPANY_DIR, company_name)
    os.makedirs(vector_path, exist_ok=True)

    if rebuild or not os.path.exists(os.path.join(vector_path, "index.faiss")):
        all_chunks = []
        for pdf_path in glob.glob(os.path.join(company_pdf_dir, "*.pdf")):
            chunks = extract_text_from_pdf(pdf_path, use_ocr)
            all_chunks.extend(chunks)
        docs = split_text_into_documents(all_chunks)
        vector_store = FAISS.from_documents(docs, embeddings)
        vector_store.save_local(vector_path)
        save_processed_files(vector_path, {os.path.basename(p) for p in glob.glob(os.path.join(company_pdf_dir, '*.pdf'))})
        return vector_store

    from langchain_community.vectorstores import FAISS
    vector_store = FAISS.load_local(vector_path, embeddings)
    processed_files = load_processed_files(vector_path)
    all_pdfs = glob.glob(os.path.join(company_pdf_dir, "*.pdf"))
    new_pdfs = [p for p in all_pdfs if os.path.basename(p) not in processed_files]
    if not new_pdfs:
        return vector_store

    new_docs = []
    for pdf_path in new_pdfs:
        chunks = extract_text_from_pdf(pdf_path, use_ocr)
        new_docs.extend(split_text_into_documents(chunks))
        processed_files.add(os.path.basename(pdf_path))

    vector_store.add_documents(new_docs)
    vector_store.save_local(vector_path)
    save_processed_files(vector_path, processed_files)
    return vector_store

