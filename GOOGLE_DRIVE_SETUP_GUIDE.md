# 🔐 Google Drive Setup Guide - MITS General Access

This guide explains how to set up Google Drive folder sharing so that any MITS faculty member can upload Excel files and the system can fetch them automatically.

---

## 📋 **Overview**

**Goal:** Allow any `@mitsgwl.ac.in` email to access the feedback folder and enable automatic Excel file fetching.

**Setup Type:** Organization-wide sharing with domain restriction

---

## 🎯 **Step 1: Create Google Drive Folder Structure**

### **1.1 Create Main Folder**

1. Go to https://drive.google.com
2. Sign in with your MITS Google Workspace account (administrator account preferred)
3. Click **"New"** → **"Folder"**
4. Name it: **`MITS Faculty Feedback - 2025-26`**
5. Click **"Create"**

### **1.2 Create Subfolders (Optional but Recommended)**

Inside the main folder, create:
```
MITS Faculty Feedback - 2025-26/
├── Pending/           (Excel files waiting to be processed)
├── Processed/         (Completed Excel files)
├── Reports/           (Generated PDF reports)
└── Archive/           (Old semester data)
```

---

## 🔓 **Step 2: Set Up General Access for MITS Domain**

### **2.1 Configure Folder Sharing**

1. **Right-click** on the main folder → **"Share"** → **"Share"**

2. Click **"Settings"** icon (⚙️) at top right

3. Under **"General access"** section:
   - Click dropdown (currently shows "Restricted")
   - Select: **"Madhav Institute of Technology & Science"**
   
4. Set permission level:
   - Select: **"Editor"** (allows upload and edit)
   - OR **"Viewer"** (read-only, if you want only admins to upload)

5. **Important Settings:**
   - ✅ **Check:** "Editors can change permissions and share"
   - ✅ **Check:** "Viewers and commenters can see the option to download, print, and copy"

6. Click **"Done"**

### **2.2 Verify Access**

The sharing should now show:
```
🌐 Anyone at Madhav Institute of Technology & Science with the link
   Can edit (or Can view)
```

This means:
- ✅ Any `@mitsgwl.ac.in` email can access
- ✅ External emails CANNOT access
- ✅ Public access is BLOCKED

---

## 🔑 **Step 3: Get Folder ID and Share Link**

### **3.1 Copy Folder ID**

1. Open the main folder in Google Drive
2. Look at the URL in your browser:
   ```
   https://drive.google.com/drive/folders/1ABC123XYZ789_FolderID_Here
   ```
3. Copy the part after `/folders/` → This is your **Folder ID**
4. Example: `1aBcDeFgHiJkLmNoPqRsTuVwXyZ123456`

### **3.2 Copy Share Link**

1. Right-click folder → **"Get link"**
2. Click **"Copy link"**
3. Share this link with all MITS faculty members

**Example link:**
```
https://drive.google.com/drive/folders/1aBcDeFgHiJkLmNoPqRsTuVwXyZ123456?usp=sharing
```

---

## 🤖 **Step 4: Enable Service Account Access**

For the backend system to fetch files automatically, you need a **Service Account**.

### **4.1 Create Service Account**

1. Go to https://console.cloud.google.com
2. Select or create project: **"MITS Feedback System"**
3. Go to **"IAM & Admin"** → **"Service Accounts"**
4. Click **"Create Service Account"**
5. Fill in:
   - **Name:** `feedback-drive-access`
   - **Description:** `Service account for MITS Faculty Feedback System to access Google Drive`
6. Click **"Create and Continue"**
7. **Role:** Select **"Viewer"** (or "Editor" if system needs to upload)
8. Click **"Continue"** → **"Done"**

### **4.2 Generate Service Account Key**

1. Click on the newly created service account
2. Go to **"Keys"** tab
3. Click **"Add Key"** → **"Create new key"**
4. Choose format: **"JSON"**
5. Click **"Create"**
6. A JSON file will download → **Save it securely!**

### **4.3 Enable Google Drive API**

1. In Google Cloud Console, go to **"APIs & Services"** → **"Library"**
2. Search for: **"Google Drive API"**
3. Click on it → Click **"Enable"**

### **4.4 Share Folder with Service Account**

1. Open the JSON key file you downloaded
2. Find the `client_email` field:
   ```json
   {
     "type": "service_account",
     "client_email": "feedback-drive-access@project-id.iam.gserviceaccount.com",
     ...
   }
   ```
3. Copy the email address
4. Go back to Google Drive
5. Right-click your main folder → **"Share"**
6. Paste the service account email
7. Set permission: **"Viewer"** (or "Editor")
8. **Uncheck:** "Notify people"
9. Click **"Share"**

---

## 🔧 **Step 5: Configure Backend Environment Variables**

Add these to your Render deployment:

```env
# Google Drive Configuration
GOOGLE_DRIVE_FOLDER_ID=1aBcDeFgHiJkLmNoPqRsTuVwXyZ123456
GOOGLE_DRIVE_CLIENT_EMAIL=feedback-drive-access@project-id.iam.gserviceaccount.com
GOOGLE_DRIVE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nMIIE...your key here...\n-----END PRIVATE KEY-----\n"
```

### **How to get these values:**

**GOOGLE_DRIVE_FOLDER_ID:**
- From Step 3.1 above

**GOOGLE_DRIVE_CLIENT_EMAIL:**
- From the JSON key file → `client_email` field

**GOOGLE_DRIVE_PRIVATE_KEY:**
1. Open the JSON key file
2. Find the `private_key` field
3. Copy the ENTIRE value (including `-----BEGIN...` and `-----END...`)
4. Keep the `\n` characters as-is
5. Wrap in double quotes

**Important:** In Render, paste the key exactly as it appears in JSON, including all `\n` characters.

---

## 📤 **Step 6: Faculty Upload Instructions**

Share these instructions with MITS faculty members:

### **For HODs - Uploading Excel Files:**

1. **Access the folder:**
   - Use the shared link or find "MITS Faculty Feedback - 2025-26" in "Shared with me"

2. **Upload Excel file:**
   - Click **"New"** → **"File upload"**
   - Select your Excel file
   - OR drag-and-drop the file

3. **File naming convention (recommended):**
   ```
   Dept_Semester_Year.xlsx
   Examples:
   - CSE_IV_2025.xlsx
   - ECE_VI_2025.xlsx
   - Mechanical_II_2025.xlsx
   ```

4. **Wait for processing:**
   - The system automatically detects new files
   - Processing takes 2-5 minutes
   - You'll receive email notification when done

### **Access Permissions:**

| Email Domain | Can Access | Can Upload | Can Edit |
|--------------|-----------|-----------|----------|
| @mitsgwl.ac.in | ✅ Yes | ✅ Yes | ✅ Yes |
| @gmail.com | ❌ No | ❌ No | ❌ No |
| Others | ❌ No | ❌ No | ❌ No |

---

## 🔒 **Security Settings**

### **Recommended Folder Permissions:**

```
General Access:
├─ Anyone at MITS → Editor
├─ Service Account → Viewer
└─ External sharing → BLOCKED
```

### **Additional Security:**

1. **Enable Version History:**
   - Automatically tracks all changes
   - Can restore deleted files

2. **Set Up Access Logs:**
   - Go to folder → Details → Activity
   - Monitor who accessed/modified files

3. **Regular Audits:**
   - Monthly review of folder access
   - Remove inactive users
   - Check for unauthorized access

---

## 🧪 **Step 7: Test the Setup**

### **7.1 Test Manual Access**

1. Open an incognito window
2. Sign in with a different `@mitsgwl.ac.in` account
3. Access the shared link
4. Try uploading a test file
5. Verify you can see and download it

### **7.2 Test Service Account Access**

Run this test script on your backend:

```javascript
// backend/test_drive_access.js
const { google } = require('googleapis');

async function testDriveAccess() {
  try {
    const auth = new google.auth.GoogleAuth({
      credentials: {
        client_email: process.env.GOOGLE_DRIVE_CLIENT_EMAIL,
        private_key: process.env.GOOGLE_DRIVE_PRIVATE_KEY.replace(/\\n/g, '\n'),
      },
      scopes: ['https://www.googleapis.com/auth/drive.readonly'],
    });

    const drive = google.drive({ version: 'v3', auth });
    
    const response = await drive.files.list({
      q: `'${process.env.GOOGLE_DRIVE_FOLDER_ID}' in parents`,
      fields: 'files(id, name, mimeType, createdTime)',
    });

    console.log('✅ Drive access successful!');
    console.log('Files found:', response.data.files.length);
    response.data.files.forEach(file => {
      console.log(`- ${file.name} (${file.mimeType})`);
    });
  } catch (error) {
    console.error('❌ Drive access failed:', error.message);
  }
}

testDriveAccess();
```

Run it:
```bash
cd backend
node test_drive_access.js
```

---

## 📊 **Step 8: Backend Integration**

Your backend already has Drive integration in `backend/services/cloudStorage.js`. Ensure these functions work:

### **Key Functions:**

1. **`listFilesInFolder(folderId)`** - Lists all Excel files
2. **`downloadFile(fileId)`** - Downloads Excel for processing
3. **`uploadFile(filename, buffer)`** - Uploads generated PDFs (optional)

### **Auto-Fetch Flow:**

```
1. HOD uploads Excel → Google Drive
2. Backend polls folder every 5 minutes
3. Detects new .xlsx files
4. Downloads and processes them
5. Generates PDF reports
6. Sends to Pro-VC for approval
```

---

## ⚠️ **Troubleshooting**

### **Problem: "Access Denied" for MITS users**

**Solution:**
1. Check General Access is set to "Madhav Institute of Technology & Science"
2. Verify user is signed in with `@mitsgwl.ac.in` account
3. Ask user to check "Shared with me" in Google Drive

### **Problem: Service Account can't access files**

**Solution:**
1. Verify service account email is added to folder sharing
2. Check `GOOGLE_DRIVE_PRIVATE_KEY` has proper `\n` characters
3. Ensure Google Drive API is enabled in Cloud Console
4. Check service account has "Viewer" permission

### **Problem: External users can access**

**Solution:**
1. Change General Access from "Anyone with link" to "Madhav Institute of Technology & Science"
2. Remove any individual external email shares

### **Problem: Files not showing in backend**

**Solution:**
1. Check `GOOGLE_DRIVE_FOLDER_ID` is correct
2. Verify service account has access to folder
3. Check file type is `.xlsx` or `.xls`
4. Look at backend logs for specific errors

---

## 📞 **Support Contacts**

**Google Workspace Admin:**
- Contact your MITS IT department
- Email: it@mitsgwalior.ac.in (example)

**Drive API Issues:**
- Check: https://console.cloud.google.com
- View quotas and API limits

**Backend Issues:**
- Check Render logs
- Verify environment variables

---

## ✅ **Setup Checklist**

- [ ] Created main Google Drive folder
- [ ] Set General Access to "MITS domain - Editor"
- [ ] Copied Folder ID
- [ ] Created Service Account
- [ ] Downloaded JSON key
- [ ] Enabled Google Drive API
- [ ] Shared folder with service account email
- [ ] Added environment variables to Render
- [ ] Tested access with different MITS email
- [ ] Tested service account access
- [ ] Shared folder link with faculty

---

## 🎉 **Success!**

Your Google Drive is now configured for MITS-wide access!

**What faculty can do:**
- ✅ Access folder with any `@mitsgwl.ac.in` email
- ✅ Upload Excel files
- ✅ View/download reports
- ✅ Collaborate with other MITS faculty

**What the system can do:**
- ✅ Automatically detect new Excel files
- ✅ Download and process them
- ✅ Generate PDF reports
- ✅ Store results back to Drive (if configured)

---

**Last Updated:** January 2025
**Version:** 1.0.0
