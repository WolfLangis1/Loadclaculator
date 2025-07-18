// Google Drive Integration API
import { google } from 'googleapis';

class GoogleDriveService {
  constructor(accessToken) {
    this.oauth2Client = new google.auth.OAuth2();
    this.oauth2Client.setCredentials({ access_token: accessToken });
    this.drive = google.drive({ version: 'v3', auth: this.oauth2Client });
  }

  // OAuth and Authentication
  static getAuthURL(clientId, redirectUri, scopes = ['https://www.googleapis.com/auth/drive.file']) {
    const oauth2Client = new google.auth.OAuth2(clientId, null, redirectUri);
    return oauth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: scopes,
      prompt: 'consent'
    });
  }

  static async exchangeCodeForTokens(clientId, clientSecret, redirectUri, code) {
    const oauth2Client = new google.auth.OAuth2(clientId, clientSecret, redirectUri);
    const { tokens } = await oauth2Client.getToken(code);
    
    return {
      accessToken: tokens.access_token,
      refreshToken: tokens.refresh_token,
      expiresAt: new Date(tokens.expiry_date).toISOString()
    };
  }

  async refreshAccessToken(clientId, clientSecret, refreshToken) {
    const oauth2Client = new google.auth.OAuth2(clientId, clientSecret);
    oauth2Client.setCredentials({ refresh_token: refreshToken });
    
    const { credentials } = await oauth2Client.refreshAccessToken();
    
    return {
      accessToken: credentials.access_token,
      refreshToken: credentials.refresh_token,
      expiresAt: new Date(credentials.expiry_date).toISOString()
    };
  }

  // Folder Management
  async createFolder(name, parentFolderId = null) {
    const fileMetadata = {
      name: name,
      mimeType: 'application/vnd.google-apps.folder',
      parents: parentFolderId ? [parentFolderId] : undefined
    };

    const response = await this.drive.files.create({
      resource: fileMetadata,
      fields: 'id, name, createdTime, modifiedTime'
    });

    return response.data;
  }

  async createProjectFolderStructure(projectName, customerName, rootFolderId = null) {
    // Create main project folder
    const projectFolderName = `${customerName} - ${projectName}`;
    const projectFolder = await this.createFolder(projectFolderName, rootFolderId);

    // Create subfolders for different document types
    const subfolders = [
      'Load Calculations',
      'SLD Diagrams',
      'Permits & Approvals',
      'Photos',
      'Contracts & Proposals',
      'Correspondence',
      'Inspection Reports',
      'Completion Documents'
    ];

    const createdSubfolders = {};
    for (const folderName of subfolders) {
      const subfolder = await this.createFolder(folderName, projectFolder.id);
      createdSubfolders[folderName.toLowerCase().replace(/\s+/g, '_')] = subfolder;
    }

    return {
      projectFolder,
      subfolders: createdSubfolders
    };
  }

  async getFolderContents(folderId) {
    const response = await this.drive.files.list({
      q: `'${folderId}' in parents and trashed=false`,
      fields: 'files(id, name, mimeType, size, createdTime, modifiedTime, webViewLink, thumbnailLink)',
      orderBy: 'modifiedTime desc'
    });

    return response.data.files;
  }

  // File Management
  async uploadFile(fileName, fileBuffer, mimeType, parentFolderId = null, description = null) {
    const fileMetadata = {
      name: fileName,
      parents: parentFolderId ? [parentFolderId] : undefined,
      description: description
    };

    const media = {
      mimeType: mimeType,
      body: fileBuffer
    };

    const response = await this.drive.files.create({
      resource: fileMetadata,
      media: media,
      fields: 'id, name, webViewLink, webContentLink, size, createdTime'
    });

    return response.data;
  }

  async uploadPDFReport(reportBuffer, fileName, projectFolderId, subfolder = 'load_calculations') {
    // Find the appropriate subfolder
    const folderContents = await this.getFolderContents(projectFolderId);
    const targetFolder = folderContents.find(file => 
      file.mimeType === 'application/vnd.google-apps.folder' && 
      file.name.toLowerCase().includes(subfolder.replace('_', ' '))
    );

    const parentId = targetFolder ? targetFolder.id : projectFolderId;

    return this.uploadFile(
      fileName, 
      reportBuffer, 
      'application/pdf', 
      parentId,
      `Load calculation report generated on ${new Date().toLocaleDateString()}`
    );
  }

  async uploadSLDDiagram(imageBuffer, fileName, projectFolderId) {
    // Find SLD diagrams folder
    const folderContents = await this.getFolderContents(projectFolderId);
    const sldFolder = folderContents.find(file => 
      file.mimeType === 'application/vnd.google-apps.folder' && 
      file.name.toLowerCase().includes('sld')
    );

    const parentId = sldFolder ? sldFolder.id : projectFolderId;

    return this.uploadFile(
      fileName, 
      imageBuffer, 
      'image/png', 
      parentId,
      `Single line diagram generated on ${new Date().toLocaleDateString()}`
    );
  }

  async getFile(fileId) {
    const response = await this.drive.files.get({
      fileId: fileId,
      fields: 'id, name, mimeType, size, createdTime, modifiedTime, webViewLink, webContentLink'
    });

    return response.data;
  }

  async downloadFile(fileId) {
    const response = await this.drive.files.get({
      fileId: fileId,
      alt: 'media'
    });

    return response.data;
  }

  async deleteFile(fileId) {
    await this.drive.files.delete({
      fileId: fileId
    });
    return true;
  }

  // Sharing and Permissions
  async shareFolder(folderId, email, role = 'reader') {
    const permission = {
      type: 'user',
      role: role, // 'reader', 'writer', 'commenter'
      emailAddress: email
    };

    const response = await this.drive.permissions.create({
      fileId: folderId,
      resource: permission,
      sendNotificationEmail: true,
      emailMessage: 'You have been granted access to this electrical project folder.'
    });

    return response.data;
  }

  async shareFolderWithLink(folderId, role = 'reader') {
    const permission = {
      type: 'anyone',
      role: role
    };

    await this.drive.permissions.create({
      fileId: folderId,
      resource: permission
    });

    // Get the shareable link
    const file = await this.drive.files.get({
      fileId: folderId,
      fields: 'webViewLink'
    });

    return file.data.webViewLink;
  }

  async getFolderPermissions(folderId) {
    const response = await this.drive.permissions.list({
      fileId: folderId,
      fields: 'permissions(id, type, role, emailAddress)'
    });

    return response.data.permissions;
  }

  // Search and Organization
  async searchFiles(query, folderId = null) {
    let searchQuery = `name contains '${query}' and trashed=false`;
    if (folderId) {
      searchQuery += ` and '${folderId}' in parents`;
    }

    const response = await this.drive.files.list({
      q: searchQuery,
      fields: 'files(id, name, mimeType, webViewLink, createdTime)',
      orderBy: 'relevance'
    });

    return response.data.files;
  }

  async moveFile(fileId, newParentFolderId, oldParentFolderId = null) {
    const updateParams = {
      fileId: fileId,
      addParents: newParentFolderId
    };

    if (oldParentFolderId) {
      updateParams.removeParents = oldParentFolderId;
    }

    const response = await this.drive.files.update(updateParams);
    return response.data;
  }

  // Project-specific utilities
  async getProjectFiles(projectFolderId, fileType = null) {
    const files = await this.getFolderContents(projectFolderId);
    
    if (fileType) {
      const mimeTypeMap = {
        'pdf': 'application/pdf',
        'image': 'image/',
        'document': 'application/vnd.google-apps.document',
        'spreadsheet': 'application/vnd.google-apps.spreadsheet'
      };
      
      const targetMimeType = mimeTypeMap[fileType];
      if (targetMimeType) {
        return files.filter(file => file.mimeType.includes(targetMimeType));
      }
    }

    return files;
  }

  async organizeProjectFiles(projectFolderId) {
    const files = await this.getFolderContents(projectFolderId);
    
    // Get subfolders
    const subfolders = files.filter(file => file.mimeType === 'application/vnd.google-apps.folder');
    
    // Organize files by type
    const unorganizedFiles = files.filter(file => file.mimeType !== 'application/vnd.google-apps.folder');
    
    for (const file of unorganizedFiles) {
      let targetFolder = null;
      
      // Determine target folder based on file type/name
      if (file.name.toLowerCase().includes('load') || file.name.toLowerCase().includes('calculation')) {
        targetFolder = subfolders.find(f => f.name.toLowerCase().includes('load'));
      } else if (file.name.toLowerCase().includes('sld') || file.name.toLowerCase().includes('diagram')) {
        targetFolder = subfolders.find(f => f.name.toLowerCase().includes('sld'));
      } else if (file.mimeType.includes('image/')) {
        targetFolder = subfolders.find(f => f.name.toLowerCase().includes('photo'));
      } else if (file.mimeType === 'application/pdf') {
        if (file.name.toLowerCase().includes('permit')) {
          targetFolder = subfolders.find(f => f.name.toLowerCase().includes('permit'));
        } else if (file.name.toLowerCase().includes('contract') || file.name.toLowerCase().includes('proposal')) {
          targetFolder = subfolders.find(f => f.name.toLowerCase().includes('contract'));
        }
      }
      
      if (targetFolder) {
        await this.moveFile(file.id, targetFolder.id, projectFolderId);
      }
    }
    
    return { organized: true, filesMoved: unorganizedFiles.length };
  }

  async createProjectTimeline(projectFolderId, activities) {
    // Create a document summarizing project timeline
    const timelineContent = activities.map(activity => 
      `${new Date(activity.created_at).toLocaleDateString()}: ${activity.title}\n${activity.description || ''}\n`
    ).join('\n');

    // This would require Google Docs API integration to create actual documents
    // For now, we'll create a simple text file
    const timelineBuffer = Buffer.from(timelineContent, 'utf8');
    
    return this.uploadFile(
      'Project Timeline.txt',
      timelineBuffer,
      'text/plain',
      projectFolderId,
      'Project timeline and activity log'
    );
  }
}

export default async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    const { action } = req.query;
    const { accessToken, ...requestData } = req.body;

    if (!accessToken && action !== 'auth_url') {
      return res.status(401).json({ error: 'Access token required' });
    }

    const drive = new GoogleDriveService(accessToken);

    switch (action) {
      case 'auth_url':
        const { clientId, redirectUri } = requestData;
        const authUrl = GoogleDriveService.getAuthURL(clientId, redirectUri);
        return res.status(200).json({ authUrl });

      case 'exchange_code':
        const { clientId: exchangeClientId, clientSecret, redirectUri: exchangeRedirectUri, code } = requestData;
        const tokens = await GoogleDriveService.exchangeCodeForTokens(
          exchangeClientId, 
          clientSecret, 
          exchangeRedirectUri, 
          code
        );
        return res.status(200).json(tokens);

      case 'create_project_folder':
        const { projectName, customerName, rootFolderId } = requestData;
        const folderStructure = await drive.createProjectFolderStructure(projectName, customerName, rootFolderId);
        return res.status(201).json({ folderStructure });

      case 'upload_file':
        const { fileName, fileData, mimeType, parentFolderId, description } = requestData;
        const fileBuffer = Buffer.from(fileData, 'base64');
        const uploadedFile = await drive.uploadFile(fileName, fileBuffer, mimeType, parentFolderId, description);
        return res.status(201).json({ file: uploadedFile });

      case 'upload_pdf_report':
        const { reportData, fileName: pdfFileName, projectFolderId, subfolder } = requestData;
        const pdfBuffer = Buffer.from(reportData, 'base64');
        const pdfFile = await drive.uploadPDFReport(pdfBuffer, pdfFileName, projectFolderId, subfolder);
        return res.status(201).json({ file: pdfFile });

      case 'upload_sld_diagram':
        const { imageData, fileName: sldFileName, projectFolderId: sldProjectFolderId } = requestData;
        const imageBuffer = Buffer.from(imageData, 'base64');
        const sldFile = await drive.uploadSLDDiagram(imageBuffer, sldFileName, sldProjectFolderId);
        return res.status(201).json({ file: sldFile });

      case 'get_folder_contents':
        const { folderId } = requestData;
        const contents = await drive.getFolderContents(folderId);
        return res.status(200).json({ files: contents });

      case 'get_project_files':
        const { projectFolderId: getProjectFolderId, fileType } = requestData;
        const projectFiles = await drive.getProjectFiles(getProjectFolderId, fileType);
        return res.status(200).json({ files: projectFiles });

      case 'share_folder':
        const { folderId: shareFolderId, email, role } = requestData;
        const permission = await drive.shareFolder(shareFolderId, email, role);
        return res.status(200).json({ permission });

      case 'share_folder_link':
        const { folderId: linkFolderId, role: linkRole } = requestData;
        const shareLink = await drive.shareFolderWithLink(linkFolderId, linkRole);
        return res.status(200).json({ shareLink });

      case 'search_files':
        const { query, folderId: searchFolderId } = requestData;
        const searchResults = await drive.searchFiles(query, searchFolderId);
        return res.status(200).json({ files: searchResults });

      case 'organize_files':
        const { projectFolderId: organizeFolderId } = requestData;
        const organizeResult = await drive.organizeProjectFiles(organizeFolderId);
        return res.status(200).json(organizeResult);

      case 'create_timeline':
        const { projectFolderId: timelineFolderId, activities } = requestData;
        const timelineFile = await drive.createProjectTimeline(timelineFolderId, activities);
        return res.status(201).json({ file: timelineFile });

      case 'delete_file':
        const { fileId } = requestData;
        await drive.deleteFile(fileId);
        return res.status(200).json({ deleted: true });

      default:
        return res.status(400).json({ error: 'Invalid action' });
    }
  } catch (error) {
    console.error('Google Drive Integration Error:', error);
    return res.status(500).json({
      error: error.message || 'Internal server error',
      details: error.response?.data || null
    });
  }
}