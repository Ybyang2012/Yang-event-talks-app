#!/usr/bin/env python3
"""
Google Drive File Uploader Utility
Based on Google Developer Knowledge for Google Drive API v3.

Prerequisites:
  1. Install required packages:
     pip install google-api-python-client google-auth-httplib2 google-auth-oauthlib

  2. Enable the Google Drive API in the Google Cloud Console.

  3. Setup authentication:
     - OAuth 2.0 Desktop Client: Download the OAuth credentials JSON file, name it
       'credentials.json', and place it in the same directory as this script.
     - Service Account: Generate a Service Account key in JSON format, name it
       'service_account.json', and place it in the same directory as this script.
"""

import os
import sys
import argparse
import mimetypes
from google.auth.transport.requests import Request
from google.oauth2 import service_account
from google.oauth2.credentials import Credentials
from google_auth_oauthlib.flow import InstalledAppFlow
from googleapiclient.discovery import build
from googleapiclient.errors import HttpError
from googleapiclient.http import MediaFileUpload

# If modifying these scopes, delete the file token.json.
# 'drive.file' is recommended as it only accesses files created/uploaded by this app.
SCOPES = ['https://www.googleapis.com/auth/drive.file']


def get_gdrive_service(auth_mode='oauth', creds_path=None):
    """
    Authenticates and returns an authorized Google Drive API client service.
    """
    creds = None

    if auth_mode == 'service_account':
        # Service Account Auth Flow
        path = creds_path or 'service_account.json'
        if not os.path.exists(path):
            print(f"Error: Service account file '{path}' not found.")
            print("Please create a Service Account in the GCP Console and save its key here.")
            sys.exit(1)
        creds = service_account.Credentials.from_service_account_file(
            path, scopes=SCOPES
        )
        print("Authenticated using Service Account.")

    else:
        # OAuth 2.0 Desktop App Flow (Browser-based)
        token_path = 'token.json'
        client_creds_path = creds_path or 'credentials.json'

        # The file token.json stores the user's access and refresh tokens, and is
        # created automatically when the authorization flow completes for the first time.
        if os.path.exists(token_path):
            creds = Credentials.from_authorized_user_file(token_path, SCOPES)

        # If there are no (valid) credentials available, let the user log in.
        if not creds or not creds.valid:
            if creds and creds.expired and creds.refresh_token:
                creds.refresh(Request())
            else:
                if not os.path.exists(client_creds_path):
                    print(f"Error: Client credentials file '{client_creds_path}' not found.")
                    print("Please download your client secrets JSON from GCP Console -> APIs -> Credentials.")
                    sys.exit(1)
                
                flow = InstalledAppFlow.from_client_secrets_file(
                    client_creds_path, SCOPES
                )
                creds = flow.run_local_server(port=0)

            # Save the credentials for the next run
            with open(token_path, 'w') as token:
                token.write(creds.to_json())
        print("Authenticated using OAuth 2.0 User Flow.")

    # Build and return the Drive Service
    return build('drive', 'v3', credentials=creds)


def upload_file(service, local_file_path, folder_id=None):
    """
    Uploads a file to Google Drive.
    """
    if not os.path.exists(local_file_path):
        print(f"Error: Local file '{local_file_path}' does not exist.")
        return None

    # Get file name and guess mime type
    file_name = os.path.basename(local_file_path)
    mime_type, _ = mimetypes.guess_type(local_file_path)
    if not mime_type:
        mime_type = 'application/octet-stream'

    print(f"Preparing upload: {file_name} ({mime_type})")

    # Define metadata
    file_metadata = {
        'name': file_name
    }
    
    # If folder ID is supplied, direct the file into that parent folder
    if folder_id:
        file_metadata['parents'] = [folder_id]

    try:
        # Create media upload object. resumable=True supports chunked loading,
        # which is robust for network drops and larger file payloads.
        media = MediaFileUpload(
            local_file_path, 
            mimetype=mime_type, 
            resumable=True
        )

        print("Uploading file to Google Drive...")
        file = service.files().create(
            body=file_metadata,
            media_body=media,
            fields='id, name, webViewLink'
        ).execute()

        print("\n🎉 Upload Successful!")
        print(f"File ID:   {file.get('id')}")
        print(f"File Name: {file.get('name')}")
        print(f"Link:      {file.get('webViewLink')}")
        return file.get('id')

    except HttpError as error:
        print(f"An API error occurred: {error}")
        return None
    except Exception as e:
        print(f"An unexpected error occurred: {e}")
        return None


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description="Upload a local file to Google Drive using Drive API v3.")
    parser.add_argument('--file', required=True, help="Path to the local file to upload")
    parser.add_argument('--folder', help="Target Google Drive Folder ID to upload into")
    parser.add_argument('--auth', choices=['oauth', 'service_account'], default='oauth',
                        help="Authentication mode: 'oauth' (user consent browser) or 'service_account'")
    parser.add_argument('--creds', help="Path to credentials JSON file (defaults: 'credentials.json' or 'service_account.json')")
    
    args = parser.parse_args()

    # Authenticate
    drive_service = get_gdrive_service(auth_mode=args.auth, creds_path=args.creds)
    
    # Upload
    upload_file(drive_service, args.file, folder_id=args.folder)
