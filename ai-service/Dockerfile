FROM python:3.11-slim
WORKDIR /app

# Install system dependencies for OpenCV
RUN apt-get update && apt-get install -y \
    libglib2.0-0 libsm6 libxext6 libxrender-dev libgomp1 \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
# Install without heavy ML packages for mock mode
RUN pip install --no-cache-dir fastapi uvicorn[standard] python-multipart \
    numpy pillow python-dotenv pydantic loguru aiofiles

# Uncomment for full model support:
# RUN pip install --no-cache-dir -r requirements.txt

COPY . .
RUN mkdir -p model/weights

EXPOSE 8000
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
