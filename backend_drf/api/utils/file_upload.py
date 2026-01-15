import os
from django.conf import settings

def save_file_to_server(file, folder_name):
    upload_path = os.path.join(settings.MEDIA_ROOT, folder_name)

    if not os.path.exists(upload_path):
        os.makedirs(upload_path)

    file_path = os.path.join(upload_path, file.name)

    with open(file_path, "wb+") as destination:
        for chunk in file.chunks():
            destination.write(chunk)

    print("IMAGE SAVED T:", file_path)

    file_url = f"{settings.SERVER_URL}{settings.MEDIA_URL}{folder_name}/{file.name}"

    return file_url
