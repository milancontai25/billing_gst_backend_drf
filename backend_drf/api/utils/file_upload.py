# import os
# import uuid
# from django.conf import settings
# from django.utils.text import slugify

# def save_file_to_server(file, folder_name):

#     upload_path = os.path.join(settings.MEDIA_ROOT, folder_name)
    
#     if not os.path.exists(upload_path):
#         os.makedirs(upload_path)

#     original_name = os.path.basename(file.name)
#     name, ext = os.path.splitext(original_name)

#     safe_name = f"{slugify(name)}-{uuid.uuid4().hex[:8]}{ext}"

#     file_path = os.path.join(upload_path, safe_name)

#     with open(file_path, "wb+") as destination:
#         for chunk in file.chunks():
#             destination.write(chunk)

#     print("IMAGE SAVED TO:", file_path)

#     file_url = f"{settings.SERVER_URL}{settings.MEDIA_URL}{folder_name}/{safe_name}"
#     return file_url



import uuid
from django.utils.text import slugify
from django.core.files.storage import default_storage

def upload_file_to_s3(file, folder_name="uploads"):
    original_name = file.name

    if "." in original_name:
        name, ext = original_name.rsplit(".", 1)
        ext = "." + ext
    else:
        name = original_name
        ext = ""

    safe_name = f"{slugify(name)}-{uuid.uuid4().hex[:8]}{ext}"
    file_path = f"media/{folder_name}/{safe_name}"

    saved_path = default_storage.save(file_path, file)

    file_url = default_storage.url(saved_path)

    print("Uploaded to S3:", file_url)

    return file_url