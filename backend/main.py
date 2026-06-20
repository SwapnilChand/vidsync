import os
import boto3
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from datetime import datetime

app = FastAPI(title="VidSync Mock Backend")

s3_client = boto3.client(
    's3',
    region_name=os.getenv('AWS_REGION', 'us-east-1'),
    aws_access_key_id=os.getenv('AWS_ACCESS_KEY_ID', 'mock-key'),
    aws_secret_access_key=os.getenv('AWS_SECRET_ACCESS_KEY', 'mock-secret')
)

BUCKET_NAME = os.getenv("S3_BUCKET_NAME", "vidsync-telemetry-prod")

class UploadRequest(BaseModel):
    worker_id: str
    video_id: str

@app.post("/generate-upload-url")
def generate_presigned_url(request: UploadRequest):
    try:

        date_str = datetime.utcnow().strftime("%Y-%m-%d")
        
        object_key = f"workers/{request.worker_id}/{date_str}/{request.video_id}.mp4"
        
        presigned_url = s3_client.generate_presigned_url(
            ClientMethod='put_object',
            Params={
                'Bucket': BUCKET_NAME,
                'Key': object_key,
                'ContentType': 'video/mp4'
            },
            ExpiresIn=300
        )
        
        return {
            "upload_url": presigned_url,
            "object_key": object_key,
            "expires_in": 300
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))