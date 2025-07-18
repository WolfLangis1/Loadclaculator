// Google Gemini AI Integration for CRM Insights and Automation
import { GoogleGenerativeAI } from '@google/generative-ai';

class GeminiAIService {
  constructor(apiKey) {
    this.genAI = new GoogleGenerativeAI(apiKey);
    this.model = this.genAI.getGenerativeModel({ model: "gemini-pro" });
  }

  // Project Analysis and Insights
  async analyzeProjectData(projectData, loadData, calculations) {
    const prompt = `
      As an expert electrical contractor AI assistant, analyze this electrical project data and provide insights:

      Project Details:
      - Customer: ${projectData.customer?.name || 'Unknown'}
      - Address: ${projectData.customer?.address ? this.formatAddress(projectData.customer.address) : 'Not provided'}
      - Project Value: $${projectData.value?.toLocaleString() || 'Not estimated'}
      - Stage: ${projectData.stage?.name || 'Unknown'}
      - Priority: ${projectData.priority || 'Not set'}

      Load Calculations:
      - Total Load: ${calculations?.totalLoad || 0} Amps
      - Main Breaker: ${loadData?.mainBreaker || 'Not specified'} Amps
      - Calculation Method: ${loadData?.calculationMethod || 'Not specified'}
      - Square Footage: ${loadData?.squareFootage || 'Not provided'} sq ft

      Special Systems:
      - EVSE: ${loadData?.evse?.length > 0 ? 'Yes (' + loadData.evse.length + ' units)' : 'No'}
      - Solar: ${loadData?.solarBattery?.solar?.inverterSize > 0 ? 'Yes (' + loadData.solarBattery.solar.inverterSize + 'W)' : 'No'}
      - Battery: ${loadData?.solarBattery?.battery?.capacity > 0 ? 'Yes (' + loadData.solarBattery.battery.capacity + 'kWh)' : 'No'}

      Please provide:
      1. Project Risk Assessment (Low/Medium/High) with reasoning
      2. Recommended next actions for the sales process
      3. Technical considerations and potential challenges
      4. Estimated timeline for completion
      5. Upselling opportunities
      6. Code compliance notes

      Format your response as structured JSON with clear sections.
    `;

    try {
      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      return this.parseAIResponse(response.text());
    } catch (error) {
      console.error('Gemini AI analysis error:', error);
      return this.getFallbackAnalysis(projectData, loadData, calculations);
    }
  }

  // Customer Communication Analysis
  async analyzeCustomerCommunications(emails, projectData) {
    const emailSummary = emails.slice(0, 5).map(email => 
      `Subject: ${email.subject || 'No subject'}\nSnippet: ${email.snippet || 'No preview'}`
    ).join('\n---\n');

    const prompt = `
      Analyze these recent customer communications for project: ${projectData.customer?.name || 'Unknown Customer'}

      Recent Emails:
      ${emailSummary}

      Project Context:
      - Stage: ${projectData.stage?.name || 'Unknown'}
      - Value: $${projectData.value?.toLocaleString() || 'Not estimated'}
      - Priority: ${projectData.priority || 'Not set'}

      Please provide:
      1. Customer sentiment analysis (Positive/Neutral/Negative)
      2. Key concerns or requirements mentioned
      3. Urgency level (Low/Medium/High)
      4. Recommended follow-up actions
      5. Response priority suggestions
      6. Any red flags or opportunities

      Respond in structured JSON format.
    `;

    try {
      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      return this.parseAIResponse(response.text());
    } catch (error) {
      console.error('Communication analysis error:', error);
      return this.getFallbackCommunicationAnalysis(emails);
    }
  }

  // Lead Scoring and Qualification
  async scoreAndQualifyLead(customerData, projectData, interactionHistory) {
    const prompt = `
      Score and qualify this electrical contracting lead:

      Customer Information:
      - Name: ${customerData.name || 'Unknown'}
      - Company: ${customerData.company || 'Residential'}
      - Source: ${customerData.source || 'Unknown'}
      - Location: ${customerData.address ? this.formatAddress(customerData.address) : 'Not provided'}

      Project Details:
      - Estimated Value: $${projectData.value?.toLocaleString() || 'Not provided'}
      - Timeline: ${projectData.expected_close_date || 'Not specified'}
      - Special Requirements: ${this.extractSpecialRequirements(projectData)}

      Interaction History:
      - Number of touchpoints: ${interactionHistory.length || 0}
      - Response rate: ${this.calculateResponseRate(interactionHistory)}
      - Last contact: ${interactionHistory[0]?.created_at || 'Never'}

      Provide a lead score (0-100) and qualification assessment including:
      1. Lead Score with breakdown of factors
      2. Qualification status (Hot/Warm/Cold)
      3. Budget likelihood (High/Medium/Low)
      4. Timeline realistic assessment
      5. Decision maker status
      6. Competition risk level
      7. Recommended priority level
      8. Next best actions

      Format as structured JSON.
    `;

    try {
      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      return this.parseAIResponse(response.text());
    } catch (error) {
      console.error('Lead scoring error:', error);
      return this.getFallbackLeadScore(customerData, projectData);
    }
  }

  // Proposal Generation
  async generateProposalContent(projectData, loadData, calculations, templates = {}) {
    const prompt = `
      Generate a professional electrical work proposal for:

      Customer: ${projectData.customer?.name || 'Valued Customer'}
      Project Location: ${projectData.customer?.address ? this.formatAddress(projectData.customer.address) : 'Customer Location'}

      Technical Specifications:
      - Total Electrical Load: ${calculations?.totalLoad || 0} Amps
      - Main Service: ${loadData?.mainBreaker || 'TBD'} Amp Panel
      - Calculation Method: ${loadData?.calculationMethod || 'Standard NEC'}
      - Building Size: ${loadData?.squareFootage || 'TBD'} square feet

      Special Systems:
      ${loadData?.evse?.length > 0 ? `- Electric Vehicle Charging: ${loadData.evse.length} EVSE units` : ''}
      ${loadData?.solarBattery?.solar?.inverterSize > 0 ? `- Solar System: ${loadData.solarBattery.solar.inverterSize}W inverter` : ''}
      ${loadData?.solarBattery?.battery?.capacity > 0 ? `- Battery Storage: ${loadData.solarBattery.battery.capacity}kWh capacity` : ''}

      Generate a professional proposal including:
      1. Executive Summary
      2. Scope of Work breakdown
      3. Technical specifications
      4. Safety and code compliance notes
      5. Project timeline
      6. Investment summary
      7. Next steps

      Write in professional contractor language suitable for customer presentation.
      Include relevant NEC code references where appropriate.
    `;

    try {
      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      return {
        content: response.text(),
        generatedAt: new Date().toISOString(),
        projectValue: projectData.value
      };
    } catch (error) {
      console.error('Proposal generation error:', error);
      return this.getFallbackProposal(projectData, loadData, calculations);
    }
  }

  // Email Response Suggestions
  async suggestEmailResponse(originalEmail, projectContext, responseType = 'professional') {
    const prompt = `
      Suggest a ${responseType} email response for this electrical contractor communication:

      Original Email Subject: ${originalEmail.subject || 'No subject'}
      Email Content: ${originalEmail.body || originalEmail.snippet || 'No content available'}

      Project Context:
      - Customer: ${projectContext.customer?.name || 'Customer'}
      - Project Stage: ${projectContext.stage?.name || 'Unknown'}
      - Project Value: $${projectContext.value?.toLocaleString() || 'TBD'}

      Generate an appropriate response that:
      1. Addresses the customer's concerns or questions
      2. Maintains professional electrical contractor tone
      3. Provides helpful technical information if needed
      4. Moves the project forward appropriately
      5. Includes relevant next steps

      Keep the response concise but thorough.
    `;

    try {
      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      return {
        suggestedResponse: response.text(),
        confidence: 'high',
        responseType: responseType,
        generatedAt: new Date().toISOString()
      };
    } catch (error) {
      console.error('Email suggestion error:', error);
      return this.getFallbackEmailResponse(originalEmail, projectContext);
    }
  }

  // Market Analysis and Pricing Insights
  async analyzeMarketOpportunity(projectData, regionalData = {}) {
    const prompt = `
      Analyze the market opportunity for this electrical project:

      Project Details:
      - Type: ${this.determineProjectType(projectData)}
      - Value: $${projectData.value?.toLocaleString() || 'TBD'}
      - Location: ${projectData.customer?.address ? this.formatAddress(projectData.customer.address) : 'Not specified'}
      - Special Features: ${this.extractSpecialRequirements(projectData)}

      Regional Context:
      - Market: ${regionalData.market || 'General'}
      - Competition Level: ${regionalData.competition || 'Unknown'}
      - Economic Conditions: ${regionalData.economy || 'Stable'}

      Provide insights on:
      1. Market demand assessment
      2. Competitive positioning recommendations
      3. Pricing strategy suggestions
      4. Timing considerations
      5. Risk factors
      6. Growth opportunities
      7. Recommended marketing approach

      Format as actionable business insights in JSON structure.
    `;

    try {
      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      return this.parseAIResponse(response.text());
    } catch (error) {
      console.error('Market analysis error:', error);
      return this.getFallbackMarketAnalysis(projectData);
    }
  }

  // Performance Metrics Analysis
  async analyzeBusinessPerformance(metrics, trends) {
    const prompt = `
      Analyze business performance for electrical contracting company:

      Current Metrics:
      - Total Customers: ${metrics.totalCustomers || 0}
      - Active Projects: ${metrics.activeProjects || 0}
      - Pipeline Value: $${metrics.totalValue?.toLocaleString() || '0'}
      - Conversion Rate: ${metrics.conversionRate || 0}%
      - Average Project Value: $${metrics.averageProjectValue?.toLocaleString() || '0'}

      Trends:
      - Customer Growth: ${trends.customerGrowth || 'Unknown'}
      - Project Volume: ${trends.projectVolume || 'Unknown'}
      - Revenue Trend: ${trends.revenue || 'Unknown'}
      - Market Share: ${trends.marketShare || 'Unknown'}

      Provide strategic insights including:
      1. Performance assessment (Excellent/Good/Fair/Poor)
      2. Key strengths and opportunities
      3. Areas needing improvement
      4. Recommended actions for growth
      5. Market positioning advice
      6. Operational efficiency suggestions
      7. Customer satisfaction indicators

      Format as strategic business recommendations in JSON.
    `;

    try {
      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      return this.parseAIResponse(response.text());
    } catch (error) {
      console.error('Performance analysis error:', error);
      return this.getFallbackPerformanceAnalysis(metrics);
    }
  }

  // Helper Methods
  formatAddress(address) {
    if (typeof address === 'string') return address;
    return [address.street, address.city, address.state, address.zipCode]
      .filter(Boolean).join(', ');
  }

  extractSpecialRequirements(projectData) {
    const requirements = [];
    if (projectData.custom_fields?.hasEVSE) requirements.push('EVSE Installation');
    if (projectData.custom_fields?.hasSolar) requirements.push('Solar Integration');
    if (projectData.custom_fields?.hasBattery) requirements.push('Battery Storage');
    if (projectData.custom_fields?.totalLoad > 200) requirements.push('Heavy Load Service');
    return requirements.length > 0 ? requirements.join(', ') : 'Standard electrical work';
  }

  determineProjectType(projectData) {
    const customFields = projectData.custom_fields || {};
    if (customFields.hasSolar && customFields.hasBattery) return 'Solar + Battery Installation';
    if (customFields.hasSolar) return 'Solar Installation';
    if (customFields.hasEVSE) return 'EV Charging Installation';
    if (customFields.totalLoad > 200) return 'Heavy Load Service Upgrade';
    return 'General Electrical Work';
  }

  calculateResponseRate(interactions) {
    if (!interactions || interactions.length === 0) return 'Unknown';
    const responses = interactions.filter(i => i.type === 'email' && i.direction === 'inbound');
    return `${Math.round((responses.length / interactions.length) * 100)}%`;
  }

  parseAIResponse(text) {
    try {
      // Try to extract JSON from the response
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
      // If no JSON, return structured text
      return { content: text, format: 'text' };
    } catch (error) {
      return { content: text, format: 'text', parseError: true };
    }
  }

  // Fallback Methods (when AI is unavailable)
  getFallbackAnalysis(projectData, loadData, calculations) {
    const totalLoad = calculations?.totalLoad || 0;
    const projectValue = projectData.value || 0;
    
    return {
      riskAssessment: totalLoad > 200 || projectValue > 50000 ? 'High' : 'Medium',
      recommendedActions: ['Schedule site visit', 'Prepare detailed proposal', 'Follow up within 48 hours'],
      technicalConsiderations: ['Verify existing service capacity', 'Check permit requirements', 'Assess panel upgrade needs'],
      estimatedTimeline: '2-4 weeks',
      upsellOpportunities: ['Surge protection', 'Smart home integration', 'Energy monitoring'],
      codeCompliance: 'Ensure NEC compliance for all installations',
      fallback: true
    };
  }

  getFallbackCommunicationAnalysis(emails) {
    return {
      sentiment: 'Neutral',
      urgency: emails.length > 3 ? 'High' : 'Medium',
      recommendedActions: ['Respond within 24 hours', 'Schedule follow-up call'],
      concerns: ['Project timeline', 'Pricing questions'],
      fallback: true
    };
  }

  getFallbackLeadScore(customerData, projectData) {
    let score = 50; // Base score
    if (projectData.value > 25000) score += 20;
    if (customerData.source === 'referral') score += 15;
    if (customerData.company) score += 10;
    
    return {
      leadScore: Math.min(score, 100),
      qualification: score > 70 ? 'Hot' : score > 50 ? 'Warm' : 'Cold',
      budgetLikelihood: projectData.value > 15000 ? 'High' : 'Medium',
      recommendedPriority: score > 70 ? 'High' : 'Medium',
      fallback: true
    };
  }

  getFallbackProposal(projectData, loadData, calculations) {
    return {
      content: `Professional Electrical Work Proposal\n\nDear ${projectData.customer?.name || 'Valued Customer'},\n\nThank you for considering our electrical services. We are pleased to provide this proposal for your electrical project.\n\nProject Overview:\n- Total Load: ${calculations?.totalLoad || 'TBD'} Amps\n- Service Size: ${loadData?.mainBreaker || 'TBD'} Amps\n- Estimated Investment: $${projectData.value?.toLocaleString() || 'TBD'}\n\nWe look forward to working with you on this project.\n\nBest regards,\nYour Electrical Contractor`,
      generatedAt: new Date().toISOString(),
      fallback: true
    };
  }

  getFallbackEmailResponse(originalEmail, projectContext) {
    return {
      suggestedResponse: `Thank you for your email regarding your electrical project. I appreciate your inquiry and will review the details carefully. I'll get back to you within 24 hours with a comprehensive response.\n\nBest regards,\nYour Electrical Contractor`,
      confidence: 'medium',
      fallback: true
    };
  }

  getFallbackMarketAnalysis(projectData) {
    return {
      marketDemand: 'Stable',
      competitivePosition: 'Good',
      pricingStrategy: 'Market competitive',
      timing: 'Favorable',
      riskFactors: ['Economic conditions', 'Material costs'],
      opportunities: ['Referral potential', 'Repeat business'],
      fallback: true
    };
  }

  getFallbackPerformanceAnalysis(metrics) {
    return {
      performanceAssessment: 'Good',
      keyStrengths: ['Customer base', 'Project quality'],
      improvementAreas: ['Lead conversion', 'Project efficiency'],
      recommendedActions: ['Focus on customer retention', 'Streamline processes'],
      fallback: true
    };
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
    const { apiKey, ...requestData } = req.body;

    if (!apiKey) {
      return res.status(401).json({ error: 'Gemini API key required' });
    }

    const gemini = new GeminiAIService(apiKey);

    switch (action) {
      case 'analyze_project':
        const { projectData, loadData, calculations } = requestData;
        const projectAnalysis = await gemini.analyzeProjectData(projectData, loadData, calculations);
        return res.status(200).json({ analysis: projectAnalysis });

      case 'analyze_communications':
        const { emails, projectData: commProjectData } = requestData;
        const commAnalysis = await gemini.analyzeCustomerCommunications(emails, commProjectData);
        return res.status(200).json({ analysis: commAnalysis });

      case 'score_lead':
        const { customerData, projectData: leadProjectData, interactionHistory } = requestData;
        const leadScore = await gemini.scoreAndQualifyLead(customerData, leadProjectData, interactionHistory);
        return res.status(200).json({ score: leadScore });

      case 'generate_proposal':
        const { projectData: proposalProject, loadData: proposalLoad, calculations: proposalCalc, templates } = requestData;
        const proposal = await gemini.generateProposalContent(proposalProject, proposalLoad, proposalCalc, templates);
        return res.status(200).json({ proposal });

      case 'suggest_email_response':
        const { originalEmail, projectContext, responseType } = requestData;
        const emailSuggestion = await gemini.suggestEmailResponse(originalEmail, projectContext, responseType);
        return res.status(200).json({ suggestion: emailSuggestion });

      case 'analyze_market':
        const { projectData: marketProject, regionalData } = requestData;
        const marketAnalysis = await gemini.analyzeMarketOpportunity(marketProject, regionalData);
        return res.status(200).json({ analysis: marketAnalysis });

      case 'analyze_performance':
        const { metrics, trends } = requestData;
        const performanceAnalysis = await gemini.analyzeBusinessPerformance(metrics, trends);
        return res.status(200).json({ analysis: performanceAnalysis });

      default:
        return res.status(400).json({ error: 'Invalid action' });
    }
  } catch (error) {
    console.error('Gemini AI Integration Error:', error);
    return res.status(500).json({
      error: error.message || 'Internal server error',
      details: error.response?.data || null
    });
  }
}