// HubSpot CRM Integration API
import fetch from 'node-fetch';

const HUBSPOT_API_BASE = 'https://api.hubapi.com';

class HubSpotService {
  constructor(accessToken) {
    this.accessToken = accessToken;
  }

  // OAuth and Authentication
  static getAuthURL(clientId, redirectUri, scopes = ['contacts', 'crm.objects.deals.read', 'crm.objects.deals.write']) {
    const baseUrl = 'https://app.hubspot.com/oauth/authorize';
    const params = new URLSearchParams({
      client_id: clientId,
      redirect_uri: redirectUri,
      scope: scopes.join(' ')
    });
    return `${baseUrl}?${params.toString()}`;
  }

  static async exchangeCodeForTokens(clientId, clientSecret, redirectUri, code) {
    const response = await fetch('https://api.hubapi.com/oauth/v1/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri,
        code: code
      })
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(`HubSpot OAuth error: ${data.message}`);
    }

    return {
      accessToken: data.access_token,
      refreshToken: data.refresh_token,
      expiresAt: new Date(Date.now() + data.expires_in * 1000).toISOString()
    };
  }

  async refreshAccessToken(clientId, clientSecret, refreshToken) {
    const response = await fetch('https://api.hubapi.com/oauth/v1/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: new URLSearchParams({
        grant_type: 'refresh_token',
        client_id: clientId,
        client_secret: clientSecret,
        refresh_token: refreshToken
      })
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(`HubSpot token refresh error: ${data.message}`);
    }

    return {
      accessToken: data.access_token,
      refreshToken: data.refresh_token,
      expiresAt: new Date(Date.now() + data.expires_in * 1000).toISOString()
    };
  }

  // Helper method for API calls
  async apiCall(endpoint, options = {}) {
    const url = `${HUBSPOT_API_BASE}${endpoint}`;
    const response = await fetch(url, {
      ...options,
      headers: {
        'Authorization': `Bearer ${this.accessToken}`,
        'Content-Type': 'application/json',
        ...options.headers
      }
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(`HubSpot API error: ${data.message || response.statusText}`);
    }

    return data;
  }

  // Contact Management
  async getContacts(limit = 100, after = null) {
    const params = new URLSearchParams({ limit: limit.toString() });
    if (after) params.append('after', after);

    return this.apiCall(`/crm/v3/objects/contacts?${params.toString()}`);
  }

  async getContact(contactId) {
    return this.apiCall(`/crm/v3/objects/contacts/${contactId}`);
  }

  async createContact(contactData) {
    const hubspotContact = this.mapCRMCustomerToHubSpot(contactData);
    return this.apiCall('/crm/v3/objects/contacts', {
      method: 'POST',
      body: JSON.stringify({ properties: hubspotContact })
    });
  }

  async updateContact(contactId, contactData) {
    const hubspotContact = this.mapCRMCustomerToHubSpot(contactData);
    return this.apiCall(`/crm/v3/objects/contacts/${contactId}`, {
      method: 'PATCH',
      body: JSON.stringify({ properties: hubspotContact })
    });
  }

  async deleteContact(contactId) {
    return this.apiCall(`/crm/v3/objects/contacts/${contactId}`, {
      method: 'DELETE'
    });
  }

  // Deal Management
  async getDeals(limit = 100, after = null) {
    const params = new URLSearchParams({ limit: limit.toString() });
    if (after) params.append('after', after);

    return this.apiCall(`/crm/v3/objects/deals?${params.toString()}`);
  }

  async getDeal(dealId) {
    return this.apiCall(`/crm/v3/objects/deals/${dealId}`);
  }

  async createDeal(dealData, contactId) {
    const hubspotDeal = this.mapCRMProjectToHubSpot(dealData);
    
    const deal = await this.apiCall('/crm/v3/objects/deals', {
      method: 'POST',
      body: JSON.stringify({ properties: hubspotDeal })
    });

    // Associate deal with contact if provided
    if (contactId) {
      await this.associateDealWithContact(deal.id, contactId);
    }

    return deal;
  }

  async updateDeal(dealId, dealData) {
    const hubspotDeal = this.mapCRMProjectToHubSpot(dealData);
    return this.apiCall(`/crm/v3/objects/deals/${dealId}`, {
      method: 'PATCH',
      body: JSON.stringify({ properties: hubspotDeal })
    });
  }

  async deleteDeal(dealId) {
    return this.apiCall(`/crm/v3/objects/deals/${dealId}`, {
      method: 'DELETE'
    });
  }

  // Associations
  async associateDealWithContact(dealId, contactId) {
    return this.apiCall(`/crm/v3/objects/deals/${dealId}/associations/contacts/${contactId}/contact_to_deal`, {
      method: 'PUT'
    });
  }

  async getDealAssociations(dealId) {
    return this.apiCall(`/crm/v3/objects/deals/${dealId}/associations/contacts`);
  }

  // Pipeline and Stages
  async getPipelines() {
    return this.apiCall('/crm/v3/pipelines/deals');
  }

  async getPipelineStages(pipelineId) {
    return this.apiCall(`/crm/v3/pipelines/deals/${pipelineId}/stages`);
  }

  // Search
  async searchContacts(query) {
    return this.apiCall('/crm/v3/objects/contacts/search', {
      method: 'POST',
      body: JSON.stringify({
        query: query,
        limit: 50,
        properties: ['email', 'firstname', 'lastname', 'company', 'phone']
      })
    });
  }

  async searchDeals(query) {
    return this.apiCall('/crm/v3/objects/deals/search', {
      method: 'POST',
      body: JSON.stringify({
        query: query,
        limit: 50,
        properties: ['dealname', 'amount', 'dealstage', 'closedate']
      })
    });
  }

  // Data Mapping Functions
  mapCRMCustomerToHubSpot(customer) {
    const mapped = {
      email: customer.email,
      firstname: customer.name?.split(' ')[0] || customer.name,
      lastname: customer.name?.split(' ').slice(1).join(' ') || '',
      company: customer.company,
      phone: customer.phone,
      lifecyclestage: 'lead'
    };

    // Address mapping
    if (customer.address) {
      mapped.address = customer.address.street;
      mapped.city = customer.address.city;
      mapped.state = customer.address.state;
      mapped.zip = customer.address.zipCode;
      mapped.country = customer.address.country || 'United States';
    }

    // Custom properties
    if (customer.source) {
      mapped.hs_lead_status = customer.source;
    }

    if (customer.notes) {
      mapped.notes_last_contacted = customer.notes;
    }

    return mapped;
  }

  mapCRMProjectToHubSpot(project) {
    const mapped = {
      dealname: `${project.customer?.name || 'Unknown'} - Electrical Project`,
      amount: project.value,
      closedate: project.expected_close_date,
      dealstage: this.mapProjectStageToHubSpot(project.stage?.name),
      pipeline: 'default'
    };

    // Custom properties for electrical projects
    if (project.custom_fields) {
      const customFields = project.custom_fields;
      if (customFields.totalLoad) {
        mapped.electrical_load = customFields.totalLoad;
      }
      if (customFields.mainBreakerSize) {
        mapped.main_breaker_size = customFields.mainBreakerSize;
      }
      if (customFields.calculationMethod) {
        mapped.calculation_method = customFields.calculationMethod;
      }
    }

    return mapped;
  }

  mapProjectStageToHubSpot(stageName) {
    // Map CRM stages to HubSpot deal stages
    const stageMapping = {
      'Lead': 'appointmentscheduled',
      'Qualified': 'qualifiedtobuy',
      'Proposal': 'presentationscheduled',
      'Negotiation': 'decisionmakerboughtin',
      'Contract': 'contractsent',
      'Installation': 'closedwon',
      'Completed': 'closedwon',
      'Follow-up': 'closedwon'
    };

    return stageMapping[stageName] || 'appointmentscheduled';
  }

  mapHubSpotContactToCRM(hubspotContact) {
    const props = hubspotContact.properties;
    return {
      name: `${props.firstname || ''} ${props.lastname || ''}`.trim() || props.email,
      email: props.email,
      phone: props.phone,
      company: props.company,
      address: {
        street: props.address,
        city: props.city,
        state: props.state,
        zipCode: props.zip,
        country: props.country
      },
      source: props.hs_lead_status || 'hubspot',
      notes: props.notes_last_contacted,
      hubspot_id: hubspotContact.id,
      external_ids: {
        hubspot: hubspotContact.id
      },
      custom_fields: {
        hubspot_lifecycle_stage: props.lifecyclestage,
        hubspot_created_date: props.createdate
      }
    };
  }

  mapHubSpotDealToCRM(hubspotDeal) {
    const props = hubspotDeal.properties;
    return {
      value: parseFloat(props.amount) || 0,
      expected_close_date: props.closedate,
      hubspot_deal_id: hubspotDeal.id,
      external_ids: {
        hubspot: hubspotDeal.id
      },
      custom_fields: {
        hubspot_deal_stage: props.dealstage,
        hubspot_created_date: props.createdate,
        hubspot_pipeline: props.pipeline
      }
    };
  }

  // Sync Functions
  async syncContactsFromHubSpot() {
    const results = [];
    let after = null;
    
    do {
      const response = await this.getContacts(100, after);
      results.push(...response.results.map(contact => this.mapHubSpotContactToCRM(contact)));
      after = response.paging?.next?.after;
    } while (after);

    return results;
  }

  async syncDealsFromHubSpot() {
    const results = [];
    let after = null;
    
    do {
      const response = await this.getDeals(100, after);
      results.push(...response.results.map(deal => this.mapHubSpotDealToCRM(deal)));
      after = response.paging?.next?.after;
    } while (after);

    return results;
  }
}

import { cors } from '../utils/middleware.js';

export default async function handler(req, res) {
  // Apply secure CORS middleware
  if (cors(req, res)) return;

  try {
    const { action } = req.query;
    const { accessToken, ...requestData } = req.body;

    if (!accessToken && action !== 'auth_url') {
      return res.status(401).json({ error: 'Access token required' });
    }

    const hubspot = new HubSpotService(accessToken);

    switch (action) {
      case 'auth_url':
        const { clientId, redirectUri } = requestData;
        const authUrl = HubSpotService.getAuthURL(clientId, redirectUri);
        return res.status(200).json({ authUrl });

      case 'exchange_code':
        const { clientId: exchangeClientId, clientSecret, redirectUri: exchangeRedirectUri, code } = requestData;
        const tokens = await HubSpotService.exchangeCodeForTokens(
          exchangeClientId, 
          clientSecret, 
          exchangeRedirectUri, 
          code
        );
        return res.status(200).json(tokens);

      case 'sync_contacts':
        const contacts = await hubspot.syncContactsFromHubSpot();
        return res.status(200).json({ contacts });

      case 'sync_deals':
        const deals = await hubspot.syncDealsFromHubSpot();
        return res.status(200).json({ deals });

      case 'create_contact':
        const { contactData } = requestData;
        const createdContact = await hubspot.createContact(contactData);
        return res.status(201).json({ contact: createdContact });

      case 'update_contact':
        const { contactId, contactData: updateContactData } = requestData;
        const updatedContact = await hubspot.updateContact(contactId, updateContactData);
        return res.status(200).json({ contact: updatedContact });

      case 'create_deal':
        const { dealData, contactId } = requestData;
        const createdDeal = await hubspot.createDeal(dealData, contactId);
        return res.status(201).json({ deal: createdDeal });

      case 'update_deal':
        const { dealId, dealData: updateDealData } = requestData;
        const updatedDeal = await hubspot.updateDeal(dealId, updateDealData);
        return res.status(200).json({ deal: updatedDeal });

      case 'search_contacts':
        const { query } = requestData;
        const searchResults = await hubspot.searchContacts(query);
        return res.status(200).json({ results: searchResults });

      case 'get_pipelines':
        const pipelines = await hubspot.getPipelines();
        return res.status(200).json({ pipelines });

      default:
        return res.status(400).json({ error: 'Invalid action' });
    }
  } catch (error) {
    console.error('HubSpot Integration Error:', error);
    return res.status(500).json({
      error: error.message || 'Internal server error',
      details: error.response?.data || null
    });
  }
}