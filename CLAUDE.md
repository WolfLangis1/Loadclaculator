# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a professional electrical load calculator application built with React and TypeScript that performs NEC (National Electrical Code) compliant load calculations for residential and commercial electrical services. The application includes three main features: Load Calculator, Single Line Diagram (SLD) creation, and Aerial View & Site Analysis.

**Latest Update**: Successfully migrated to Vercel serverless functions architecture with comprehensive high-resolution satellite imagery integration. Fixed infinite re-rendering address field glitch and development server constant reloading issues. Implemented advanced Photo Editor with canvas-based measurement tools. All API endpoints work in production with proper Google Maps integration including enhanced satellite providers (Google Enhanced, USGS, Esri). Supabase authentication with comprehensive Google OAuth and guest mode support. All SLD features remain production-ready with WorkingIntelligentSLDCanvas including drag-and-drop, wire routing, and NEC compliance.

## Memory

- Implemented comprehensive E2E test suite with 81 test scenarios across 7 test files, covering load calculator, wire sizing, aerial view, project management, authentication, UI navigation, and accessibility testing
- Added new memory tracking system to Claude.md for maintaining development history and critical updates
- Expanded satellite imagery provider integration with automatic provider selection and zoom level detection
- Implemented advanced canvas-based photo editor with precise measurement tools and calibration capabilities