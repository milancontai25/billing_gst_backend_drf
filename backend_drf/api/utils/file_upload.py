import os
import uuid
from django.conf import settings
from django.utils.text import slugify

def save_file_to_server(file, folder_name):

    upload_path = os.path.join(settings.MEDIA_ROOT, folder_name)
    
    if not os.path.exists(upload_path):
        os.makedirs(upload_path)

    original_name = os.path.basename(file.name)
    name, ext = os.path.splitext(original_name)

    safe_name = f"{slugify(name)}-{uuid.uuid4().hex[:8]}{ext}"

    file_path = os.path.join(upload_path, safe_name)

    with open(file_path, "wb+") as destination:
        for chunk in file.chunks():
            destination.write(chunk)

    print("IMAGE SAVED TO:", file_path)

    file_url = f"{settings.SERVER_URL}{settings.MEDIA_URL}{folder_name}/{safe_name}"
    return file_url
