provider "aws" {
  region = "us-east-1"
}

# Video Storage Bucket
resource "aws_s3_bucket" "vidsync_telemetry" {
  bucket = "vidsync-telemetry-videos-prod"
}

# Block all public access
resource "aws_s3_bucket_public_access_block" "secure_bucket" {
  bucket                  = aws_s3_bucket.vidsync_telemetry.id
  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

# Allow Mobile Apps to PUT directly to the bucket via Presigned URLs
resource "aws_s3_bucket_cors_configuration" "mobile_cors" {
  bucket = aws_s3_bucket.vidsync_telemetry.id

  cors_rule {
    allowed_headers = ["*"]
    allowed_methods = ["PUT"]
    allowed_origins = ["*"]
    expose_headers  = ["ETag"]
    max_age_seconds = 3000
  }
}

# Moves old videos to deep archive to save thousands of dollars per month (Lifecycle Rules - Q3)
resource "aws_s3_bucket_lifecycle_configuration" "cost_strategy" {
  bucket = aws_s3_bucket.vidsync_telemetry.id

  rule {
    id     = "archive_old_videos"
    status = "Enabled"

    transition {
      days          = 30
      storage_class = "STANDARD_IA"
    }

    transition {
      days          = 90
      storage_class = "DEEP_ARCHIVE"
    }
  }
}