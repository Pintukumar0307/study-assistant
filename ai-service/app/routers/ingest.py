from fastapi import APIRouter, UploadFile, File, Form, Depends, HTTPException
import tempfile, os, shutil
from app.rag.indexer import indexer
from app.rag.vector_store import vector_store
from app.schemas.responses import IngestResponse
from app.core.security import verify_service_key
from app.core.logging import logger

router = APIRouter(prefix="/api/v1/ingest", tags=["ingest"])


@router.post("", response_model=IngestResponse, dependencies=[Depends(verify_service_key)])
async def ingest_document(
    file: UploadFile = File(...),
    document_id: str = Form(...),
    user_id: str = Form(...),
):
    if not file.filename.endswith(".pdf"):
        raise HTTPException(status_code=400, detail="Only PDF files supported")

    with tempfile.NamedTemporaryFile(delete=False, suffix=".pdf") as tmp:
        shutil.copyfileobj(file.file, tmp)
        tmp_path = tmp.name

    try:
        result = indexer.index_document(tmp_path, document_id, user_id)
        logger.info(f"Document {document_id} ingested: {result}")
        return IngestResponse(
            success=True,
            document_id=document_id,
            page_count=result["page_count"],
            chunk_count=result["chunk_count"],
            collection_id=result["collection_id"],
        )
    except Exception as e:
        logger.error(f"Ingestion failed for {document_id}: {e}")
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        os.unlink(tmp_path)


@router.delete("/{document_id}", dependencies=[Depends(verify_service_key)])
async def delete_document(document_id: str, user_id: str):
    vector_store.delete_collection(document_id, user_id)
    return {"success": True, "document_id": document_id}
