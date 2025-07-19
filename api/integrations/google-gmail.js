// Google Gmail API Integration
import { google } from 'googleapis';

class GmailService {
  constructor(accessToken) {
    this.oauth2Client = new google.auth.OAuth2();
    this.oauth2Client.setCredentials({ access_token: accessToken });
    this.gmail = google.gmail({ version: 'v1', auth: this.oauth2Client });
  }

  // OAuth and Authentication
  static getAuthURL(clientId, redirectUri, scopes = [
    'https://www.googleapis.com/auth/gmail.readonly',
    'https://www.googleapis.com/auth/gmail.send',
    'https://www.googleapis.com/auth/gmail.compose',
    'https://www.googleapis.com/auth/gmail.modify'
  ]) {
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

  // Email Reading
  async getMessages(query = '', maxResults = 50, pageToken = null) {
    const params = {
      userId: 'me',
      q: query,
      maxResults: maxResults
    };
    
    if (pageToken) {
      params.pageToken = pageToken;
    }

    const response = await this.gmail.users.messages.list(params);
    return response.data;
  }

  async getMessage(messageId, format = 'full') {
    const response = await this.gmail.users.messages.get({
      userId: 'me',
      id: messageId,
      format: format
    });
    
    return response.data;
  }

  async getMessageWithAttachments(messageId) {
    const message = await this.getMessage(messageId);
    
    // Extract attachments if they exist
    if (message.payload && message.payload.parts) {
      const attachments = [];
      
      for (const part of message.payload.parts) {
        if (part.filename && part.body && part.body.attachmentId) {
          const attachment = await this.gmail.users.messages.attachments.get({
            userId: 'me',
            messageId: messageId,
            id: part.body.attachmentId
          });
          
          attachments.push({
            filename: part.filename,
            mimeType: part.mimeType,
            size: part.body.size,
            data: attachment.data.data
          });
        }
      }
      
      message.attachments = attachments;
    }
    
    return message;
  }

  // Email Sending
  async sendEmail(emailData) {
    const { to, subject, body, cc, bcc, attachments } = emailData;
    
    let message = [
      `To: ${to}`,
      subject ? `Subject: ${subject}` : '',
      cc ? `Cc: ${cc}` : '',
      bcc ? `Bcc: ${bcc}` : '',
      'Content-Type: text/html; charset=utf-8',
      '',
      body || ''
    ].filter(Boolean).join('\n');

    // Handle attachments if present
    if (attachments && attachments.length > 0) {
      // For attachments, we need to create a multipart message
      const boundary = 'boundary' + Date.now();
      message = [
        `To: ${to}`,
        subject ? `Subject: ${subject}` : '',
        cc ? `Cc: ${cc}` : '',
        bcc ? `Bcc: ${bcc}` : '',
        `Content-Type: multipart/mixed; boundary=${boundary}`,
        '',
        `--${boundary}`,
        'Content-Type: text/html; charset=utf-8',
        '',
        body || '',
        ''
      ];

      // Add each attachment
      for (const attachment of attachments) {
        message.push(`--${boundary}`);
        message.push(`Content-Type: ${attachment.mimeType}`);
        message.push(`Content-Disposition: attachment; filename="${attachment.filename}"`);
        message.push('Content-Transfer-Encoding: base64');
        message.push('');
        message.push(attachment.data);
        message.push('');
      }

      message.push(`--${boundary}--`);
      message = message.join('\n');
    }

    const encodedMessage = Buffer.from(message).toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');

    const response = await this.gmail.users.messages.send({
      userId: 'me',
      requestBody: {
        raw: encodedMessage
      }
    });

    return response.data;
  }

  async replyToEmail(originalMessageId, replyBody, includeOriginal = true) {
    const originalMessage = await this.getMessage(originalMessageId);
    
    // Extract original sender and subject
    const headers = originalMessage.payload.headers;
    const fromHeader = headers.find(h => h.name.toLowerCase() === 'from');
    const subjectHeader = headers.find(h => h.name.toLowerCase() === 'subject');
    const messageIdHeader = headers.find(h => h.name.toLowerCase() === 'message-id');
    
    let replySubject = subjectHeader ? subjectHeader.value : '';
    if (!replySubject.toLowerCase().startsWith('re:')) {
      replySubject = `Re: ${replySubject}`;
    }

    let fullReplyBody = replyBody;
    if (includeOriginal) {
      const originalBody = this.extractMessageBody(originalMessage);
      fullReplyBody += `\n\n--- Original Message ---\n${originalBody}`;
    }

    const replyData = {
      to: fromHeader ? fromHeader.value : '',
      subject: replySubject,
      body: fullReplyBody,
      inReplyTo: messageIdHeader ? messageIdHeader.value : undefined,
      references: messageIdHeader ? messageIdHeader.value : undefined
    };

    return this.sendEmail(replyData);
  }

  async forwardEmail(originalMessageId, to, additionalMessage = '') {
    const originalMessage = await this.getMessageWithAttachments(originalMessageId);
    
    // Extract original details
    const headers = originalMessage.payload.headers;
    const fromHeader = headers.find(h => h.name.toLowerCase() === 'from');
    const subjectHeader = headers.find(h => h.name.toLowerCase() === 'subject');
    const dateHeader = headers.find(h => h.name.toLowerCase() === 'date');
    
    let forwardSubject = subjectHeader ? subjectHeader.value : '';
    if (!forwardSubject.toLowerCase().startsWith('fwd:')) {
      forwardSubject = `Fwd: ${forwardSubject}`;
    }

    const originalBody = this.extractMessageBody(originalMessage);
    const forwardBody = [
      additionalMessage,
      '',
      '--- Forwarded Message ---',
      `From: ${fromHeader ? fromHeader.value : 'Unknown'}`,
      `Date: ${dateHeader ? dateHeader.value : 'Unknown'}`,
      `Subject: ${subjectHeader ? subjectHeader.value : 'No Subject'}`,
      '',
      originalBody
    ].join('\n');

    const forwardData = {
      to: to,
      subject: forwardSubject,
      body: forwardBody,
      attachments: originalMessage.attachments || []
    };

    return this.sendEmail(forwardData);
  }

  // Email Management
  async markAsRead(messageId) {
    return this.gmail.users.messages.modify({
      userId: 'me',
      id: messageId,
      requestBody: {
        removeLabelIds: ['UNREAD']
      }
    });
  }

  async markAsUnread(messageId) {
    return this.gmail.users.messages.modify({
      userId: 'me',
      id: messageId,
      requestBody: {
        addLabelIds: ['UNREAD']
      }
    });
  }

  async addLabel(messageId, labelId) {
    return this.gmail.users.messages.modify({
      userId: 'me',
      id: messageId,
      requestBody: {
        addLabelIds: [labelId]
      }
    });
  }

  async removeLabel(messageId, labelId) {
    return this.gmail.users.messages.modify({
      userId: 'me',
      id: messageId,
      requestBody: {
        removeLabelIds: [labelId]
      }
    });
  }

  async deleteMessage(messageId) {
    return this.gmail.users.messages.delete({
      userId: 'me',
      id: messageId
    });
  }

  async trashMessage(messageId) {
    return this.gmail.users.messages.trash({
      userId: 'me',
      id: messageId
    });
  }

  // Labels Management
  async getLabels() {
    const response = await this.gmail.users.labels.list({
      userId: 'me'
    });
    return response.data.labels;
  }

  async createLabel(labelName, visibility = 'labelShow') {
    const response = await this.gmail.users.labels.create({
      userId: 'me',
      requestBody: {
        name: labelName,
        labelListVisibility: visibility,
        messageListVisibility: 'show'
      }
    });
    return response.data;
  }

  // Search and Filtering
  async searchEmails(query, includeSpam = false, includeTrash = false) {
    let searchQuery = query;
    
    if (!includeSpam) {
      searchQuery += ' -in:spam';
    }
    if (!includeTrash) {
      searchQuery += ' -in:trash';
    }

    return this.getMessages(searchQuery);
  }

  async getEmailsByCustomer(customerEmail, dateRange = null) {
    // Sanitize email input to prevent Gmail query injection
    const sanitizedEmail = this.sanitizeEmailAddress(customerEmail);
    if (!sanitizedEmail) {
      throw new Error('Invalid email address provided');
    }
    
    let query = `from:${sanitizedEmail} OR to:${sanitizedEmail}`;
    
    if (dateRange) {
      if (dateRange.after) {
        // Validate date format (YYYY/MM/DD)
        const sanitizedAfter = this.sanitizeDateString(dateRange.after);
        if (sanitizedAfter) {
          query += ` after:${sanitizedAfter}`;
        }
      }
      if (dateRange.before) {
        // Validate date format (YYYY/MM/DD)
        const sanitizedBefore = this.sanitizeDateString(dateRange.before);
        if (sanitizedBefore) {
          query += ` before:${sanitizedBefore}`;
        }
      }
    }

    return this.searchEmails(query);
  }

  async getProjectEmails(projectKeywords = [], customerEmail = null) {
    let query = '';
    
    if (customerEmail) {
      const sanitizedEmail = this.sanitizeEmailAddress(customerEmail);
      if (sanitizedEmail) {
        query = `(from:${sanitizedEmail} OR to:${sanitizedEmail})`;
      }
    }
    
    if (projectKeywords.length > 0) {
      // Sanitize keywords to prevent query injection
      const sanitizedKeywords = projectKeywords
        .map(keyword => this.sanitizeSearchKeyword(keyword))
        .filter(keyword => keyword !== null);
      
      if (sanitizedKeywords.length > 0) {
        const keywordQuery = sanitizedKeywords.map(keyword => `"${keyword}"`).join(' OR ');
        query = query ? `${query} AND (${keywordQuery})` : `(${keywordQuery})`;
      }
    }

    return this.searchEmails(query);
  }

  // Helper methods for input sanitization
  sanitizeEmailAddress(email) {
    if (!email || typeof email !== 'string') {
      return null;
    }
    
    // Basic email validation regex
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    const trimmedEmail = email.trim();
    
    if (emailRegex.test(trimmedEmail) && trimmedEmail.length <= 254) {
      return trimmedEmail;
    }
    
    return null;
  }

  sanitizeDateString(dateStr) {
    if (!dateStr || typeof dateStr !== 'string') {
      return null;
    }
    
    // Gmail accepts YYYY/MM/DD format
    const dateRegex = /^\d{4}\/\d{2}\/\d{2}$/;
    const trimmedDate = dateStr.trim();
    
    if (dateRegex.test(trimmedDate)) {
      return trimmedDate;
    }
    
    return null;
  }

  sanitizeSearchKeyword(keyword) {
    if (!keyword || typeof keyword !== 'string') {
      return null;
    }
    
    // Remove potentially dangerous characters and limit length
    const sanitized = keyword
      .replace(/[<>"`&]/g, '') // Remove dangerous characters
      .trim()
      .slice(0, 50); // Limit length
    
    if (sanitized.length > 0) {
      return sanitized;
    }
    
    return null;
  }

  // CRM Integration Helpers
  extractMessageBody(message) {
    if (!message.payload) return '';

    // Try to get HTML body first, then plain text
    let body = '';
    
    if (message.payload.parts) {
      const htmlPart = message.payload.parts.find(part => part.mimeType === 'text/html');
      const textPart = message.payload.parts.find(part => part.mimeType === 'text/plain');
      
      if (htmlPart && htmlPart.body && htmlPart.body.data) {
        body = Buffer.from(htmlPart.body.data, 'base64').toString();
      } else if (textPart && textPart.body && textPart.body.data) {
        body = Buffer.from(textPart.body.data, 'base64').toString();
      }
    } else if (message.payload.body && message.payload.body.data) {
      body = Buffer.from(message.payload.body.data, 'base64').toString();
    }

    return body;
  }

  extractMessageHeaders(message) {
    if (!message.payload || !message.payload.headers) return {};

    const headers = {};
    message.payload.headers.forEach(header => {
      headers[header.name.toLowerCase()] = header.value;
    });

    return headers;
  }

  mapEmailToCRMActivity(message, customerId, projectId = null) {
    const headers = this.extractMessageHeaders(message);
    const body = this.extractMessageBody(message);
    
    return {
      customer_id: customerId,
      project_id: projectId,
      type: 'email',
      title: headers.subject || 'Email Communication',
      description: body.substring(0, 500) + (body.length > 500 ? '...' : ''),
      metadata: {
        gmailMessageId: message.id,
        threadId: message.threadId,
        from: headers.from,
        to: headers.to,
        date: headers.date,
        snippet: message.snippet,
        hasAttachments: !!(message.payload && message.payload.parts && 
          message.payload.parts.some(part => part.filename))
      }
    };
  }

  // Template Management for Common Emails
  async sendProjectProposal(customerEmail, projectDetails) {
    const subject = `Electrical Work Proposal - ${projectDetails.address || 'Your Project'}`;
    
    const body = `
      <html>
        <body>
          <h2>Electrical Work Proposal</h2>
          
          <p>Dear ${projectDetails.customerName || 'Valued Customer'},</p>
          
          <p>Thank you for your interest in our electrical services. Based on our initial consultation, 
          I've prepared a proposal for your electrical project${projectDetails.address ? ` at ${projectDetails.address}` : ''}.</p>
          
          <h3>Project Overview:</h3>
          <ul>
            ${projectDetails.totalLoad ? `<li>Total Electrical Load: ${projectDetails.totalLoad} Amps</li>` : ''}
            ${projectDetails.mainBreaker ? `<li>Main Breaker Size: ${projectDetails.mainBreaker} Amps</li>` : ''}
            ${projectDetails.hasEVSE ? '<li>Electric Vehicle Supply Equipment (EVSE) Installation</li>' : ''}
            ${projectDetails.hasSolar ? '<li>Solar System Integration</li>' : ''}
            ${projectDetails.hasBattery ? '<li>Battery Storage System</li>' : ''}
          </ul>
          
          ${projectDetails.estimatedValue ? `<p><strong>Estimated Project Value:</strong> $${projectDetails.estimatedValue.toLocaleString()}</p>` : ''}
          
          <p>This proposal includes all necessary permits, materials, and labor for a complete installation 
          that meets all local codes and NEC requirements.</p>
          
          <p>I'd be happy to schedule a follow-up meeting to discuss the details and answer any questions 
          you may have.</p>
          
          <p>Best regards,<br>
          Your Electrical Contractor</p>
        </body>
      </html>
    `;

    return this.sendEmail({
      to: customerEmail,
      subject: subject,
      body: body
    });
  }

  async sendProjectUpdate(customerEmail, projectDetails, updateMessage) {
    const subject = `Project Update - ${projectDetails.address || 'Your Electrical Project'}`;
    
    const body = `
      <html>
        <body>
          <h2>Project Update</h2>
          
          <p>Dear ${projectDetails.customerName || 'Valued Customer'},</p>
          
          <p>I wanted to provide you with an update on your electrical project${projectDetails.address ? ` at ${projectDetails.address}` : ''}.</p>
          
          <div style="background-color: #f5f5f5; padding: 15px; margin: 15px 0; border-radius: 5px;">
            ${updateMessage}
          </div>
          
          <p>If you have any questions or concerns, please don't hesitate to reach out.</p>
          
          <p>Best regards,<br>
          Your Electrical Contractor</p>
        </body>
      </html>
    `;

    return this.sendEmail({
      to: customerEmail,
      subject: subject,
      body: body
    });
  }

  async sendInvoice(customerEmail, projectDetails, invoiceData) {
    const subject = `Invoice #${invoiceData.invoiceNumber} - ${projectDetails.address || 'Electrical Services'}`;
    
    const body = `
      <html>
        <body>
          <h2>Invoice for Electrical Services</h2>
          
          <p>Dear ${projectDetails.customerName || 'Valued Customer'},</p>
          
          <p>Please find attached your invoice for the electrical work completed${projectDetails.address ? ` at ${projectDetails.address}` : ''}.</p>
          
          <table style="border-collapse: collapse; width: 100%; margin: 20px 0;">
            <tr style="background-color: #f5f5f5;">
              <td style="border: 1px solid #ddd; padding: 8px;"><strong>Invoice Number:</strong></td>
              <td style="border: 1px solid #ddd; padding: 8px;">${invoiceData.invoiceNumber}</td>
            </tr>
            <tr>
              <td style="border: 1px solid #ddd; padding: 8px;"><strong>Invoice Date:</strong></td>
              <td style="border: 1px solid #ddd; padding: 8px;">${invoiceData.date}</td>
            </tr>
            <tr style="background-color: #f5f5f5;">
              <td style="border: 1px solid #ddd; padding: 8px;"><strong>Total Amount:</strong></td>
              <td style="border: 1px solid #ddd; padding: 8px;"><strong>$${invoiceData.totalAmount.toLocaleString()}</strong></td>
            </tr>
            <tr>
              <td style="border: 1px solid #ddd; padding: 8px;"><strong>Due Date:</strong></td>
              <td style="border: 1px solid #ddd; padding: 8px;">${invoiceData.dueDate}</td>
            </tr>
          </table>
          
          <p>Payment can be made by check, cash, or electronic transfer. Please reference the invoice number 
          when making payment.</p>
          
          <p>Thank you for choosing our electrical services.</p>
          
          <p>Best regards,<br>
          Your Electrical Contractor</p>
        </body>
      </html>
    `;

    return this.sendEmail({
      to: customerEmail,
      subject: subject,
      body: body,
      attachments: invoiceData.attachments || []
    });
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

    const gmail = new GmailService(accessToken);

    switch (action) {
      case 'auth_url':
        const { clientId, redirectUri } = requestData;
        const authUrl = GmailService.getAuthURL(clientId, redirectUri);
        return res.status(200).json({ authUrl });

      case 'exchange_code':
        const { clientId: exchangeClientId, clientSecret, redirectUri: exchangeRedirectUri, code } = requestData;
        const tokens = await GmailService.exchangeCodeForTokens(
          exchangeClientId, 
          clientSecret, 
          exchangeRedirectUri, 
          code
        );
        return res.status(200).json(tokens);

      case 'get_messages':
        const { query, maxResults, pageToken } = requestData;
        const messages = await gmail.getMessages(query, maxResults, pageToken);
        return res.status(200).json(messages);

      case 'get_message':
        const { messageId, format } = requestData;
        const message = await gmail.getMessage(messageId, format);
        return res.status(200).json(message);

      case 'send_email':
        const { emailData } = requestData;
        const sentEmail = await gmail.sendEmail(emailData);
        return res.status(200).json({ message: sentEmail });

      case 'reply_email':
        const { originalMessageId, replyBody, includeOriginal } = requestData;
        const reply = await gmail.replyToEmail(originalMessageId, replyBody, includeOriginal);
        return res.status(200).json({ message: reply });

      case 'forward_email':
        const { originalMessageId: forwardMessageId, to, additionalMessage } = requestData;
        const forwarded = await gmail.forwardEmail(forwardMessageId, to, additionalMessage);
        return res.status(200).json({ message: forwarded });

      case 'mark_read':
        const { messageId: readMessageId } = requestData;
        await gmail.markAsRead(readMessageId);
        return res.status(200).json({ marked: true });

      case 'mark_unread':
        const { messageId: unreadMessageId } = requestData;
        await gmail.markAsUnread(unreadMessageId);
        return res.status(200).json({ marked: true });

      case 'search_emails':
        const { searchQuery, includeSpam, includeTrash } = requestData;
        const searchResults = await gmail.searchEmails(searchQuery, includeSpam, includeTrash);
        return res.status(200).json(searchResults);

      case 'get_customer_emails':
        const { customerEmail, dateRange } = requestData;
        const customerEmails = await gmail.getEmailsByCustomer(customerEmail, dateRange);
        return res.status(200).json(customerEmails);

      case 'get_project_emails':
        const { projectKeywords, customerEmail: projectCustomerEmail } = requestData;
        const projectEmails = await gmail.getProjectEmails(projectKeywords, projectCustomerEmail);
        return res.status(200).json(projectEmails);

      case 'send_proposal':
        const { customerEmail: proposalEmail, projectDetails } = requestData;
        const proposal = await gmail.sendProjectProposal(proposalEmail, projectDetails);
        return res.status(200).json({ message: proposal });

      case 'send_update':
        const { customerEmail: updateEmail, projectDetails: updateProject, updateMessage } = requestData;
        const update = await gmail.sendProjectUpdate(updateEmail, updateProject, updateMessage);
        return res.status(200).json({ message: update });

      case 'send_invoice':
        const { customerEmail: invoiceEmail, projectDetails: invoiceProject, invoiceData } = requestData;
        const invoice = await gmail.sendInvoice(invoiceEmail, invoiceProject, invoiceData);
        return res.status(200).json({ message: invoice });

      case 'get_labels':
        const labels = await gmail.getLabels();
        return res.status(200).json({ labels });

      case 'create_label':
        const { labelName, visibility } = requestData;
        const createdLabel = await gmail.createLabel(labelName, visibility);
        return res.status(200).json({ label: createdLabel });

      case 'delete_message':
        const { messageId: deleteMessageId } = requestData;
        await gmail.deleteMessage(deleteMessageId);
        return res.status(200).json({ deleted: true });

      case 'trash_message':
        const { messageId: trashMessageId } = requestData;
        await gmail.trashMessage(trashMessageId);
        return res.status(200).json({ trashed: true });

      default:
        return res.status(400).json({ error: 'Invalid action' });
    }
  } catch (error) {
    console.error('Gmail Integration Error:', error);
    return res.status(500).json({
      error: error.message || 'Internal server error',
      details: error.response?.data || null
    });
  }
}