import os, io, glob, json, asyncio
import pdfplumber, pytesseract
from PIL import Image
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_core.documents import Document
from langchain_community.vectorstores import FAISS
from .utils import save_processed_files, load_processed_files

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

async def build_or_update_vector_store(company_name, embeddings, use_ocr=False, rebuild=False):
    vector_path = os.path.join(BASE_VECTOR_DIR, company_name)
    company_pdf_dir = os.path.join(BASE_COMPANY_DIR, company_name)
    os.makedirs(vector_path, exist_ok=True)

    if rebuild or not os.path.exists(os.path.join(vector_path, "index.faiss")):
        all_chunks = []
        for pdf_path in glob.glob(os.path.join(company_pdf_dir, "*.pdf")):
            chunks = await asyncio.to_thread(extract_text_from_pdf, pdf_path, use_ocr)
            all_chunks.extend(chunks)
        docs = await asyncio.to_thread(split_text_into_documents, all_chunks)
        vector_store = FAISS.from_documents(docs, embeddings)
        vector_store.save_local(vector_path)
        save_processed_files(vector_path, {os.path.basename(p) for p in glob.glob(os.path.join(company_pdf_dir, '*.pdf'))})
        return vector_store

    vector_store = FAISS.load_local(vector_path, embeddings, allow_dangerous_deserialization=True)
    processed_files = load_processed_files(vector_path)
    new_pdfs = [p for p in glob.glob(os.path.join(company_pdf_dir, "*.pdf")) if os.path.basename(p) not in processed_files]
    if not new_pdfs:
        return vector_store

    new_docs = []
    for pdf_path in new_pdfs:
        chunks = await asyncio.to_thread(extract_text_from_pdf, pdf_path, use_ocr)
        new_docs.extend(await asyncio.to_thread(split_text_into_documents, chunks))
        processed_files.add(os.path.basename(pdf_path))

    vector_store.add_documents(new_docs)
    vector_store.save_local(vector_path)
    save_processed_files(vector_path, processed_files)
    return vector_store

async def delete_pdf_and_reindex(company_name, filename, embeddings, use_ocr=False):
    file_path = os.path.join(BASE_COMPANY_DIR, company_name, filename)
    if os.path.exists(file_path):
        os.remove(file_path)
    return await build_or_update_vector_store(company_name, embeddings, use_ocr, rebuild=True)
