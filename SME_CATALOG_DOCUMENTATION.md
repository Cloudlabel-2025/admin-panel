# SME Work Tracking System - Catalog Documentation

## 📋 System Overview

The SME (Subject Matter Expert) Work Tracking System is a comprehensive time and task management solution integrated into the existing admin panel. It provides complete isolation between SME users and admin interfaces while maintaining seamless integration with the existing authentication system.

## 🏗️ Architecture Components

### 1. Database Models

#### SMESession Model (`src/models/SMESession.js`)
- **Purpose**: Tracks work sessions with login/logout times, breaks, and time calculations
- **Key Features**:
  - Automatic time calculations (total, break, lunch, net working time)
  - Break/lunch tracking with start/end times
  - Session status management (active, break, lunch, completed)
  - Task references for session-based task management
  - Date-based indexing for efficient queries

#### SMETask Model (`src/models/SMETask.js`)
- **Purpose**: Manages daily tasks linked to specific work sessions
- **Key Features**:
  - Session-based task isolation
  - Priority levels (low, medium, high)
  - Status tracking (pending, in-progress, completed)
  - Time tracking capabilities
  - Employee and date-based indexing

### 2. User Interface Components

#### SME Portal Layout (`src/app/components/SMELayout.js`)
- **Design**: Green-themed layout with isolated navigation
- **Features**:
  - Session status indicators
  - Real-time time display
  - Separate navigation from admin interface
  - Responsive design for mobile compatibility

#### SME Dashboard (`src/app/sme/page.js`)
- **Core Features**:
  - Session start/end controls
  - Real-time time tracking
  - Break and lunch management
  - Quick action buttons
  - Session status visualization

#### Session Management (`src/app/sme/sessions/page.js`)
- **Capabilities**:
  - Session history with filtering
  - Analytics and summary statistics
  - Time breakdown visualization
  - Export capabilities

#### Task Management (`src/app/sme/tasks/page.js`)
- **Features**:
  - CRUD operations for tasks
  - Session-based restrictions
  - Priority and status management
  - Time tracking integration

### 3. API Endpoints

#### SME Session API (`src/app/api/sme/session/route.js`)
- **Endpoints**:
  - `GET`: Retrieve active sessions or session history
  - `POST`: Manage session lifecycle (start, break, lunch, resume, end)
- **Business Rules**:
  - Single active session per user
  - Mandatory task requirement before logout
  - Automatic time calculations
  - Break/lunch time tracking

#### SME Task API (`src/app/api/sme/tasks/route.js`)
- **Endpoints**:
  - `GET`: Retrieve user's tasks with filtering
  - `POST`: Create new tasks
  - `PUT`: Update existing tasks
  - `DELETE`: Remove tasks
- **Features**:
  - User isolation
  - Session validation
  - Priority and status management

#### Admin Monitoring API (`src/app/api/admin/sme/route.js`)
- **Capabilities**:
  - Analytics dashboard data
  - SME user statistics
  - Session monitoring
  - Task oversight
  - Filtering and search functionality

### 4. Admin Interface

#### SME Monitoring Dashboard (`src/app/admin/sme-monitoring/page.js`)
- **Tabs**:
  - **Overview**: System-wide analytics and statistics
  - **SMEs**: Individual SME performance and statistics
  - **Sessions**: Detailed session monitoring with filters
  - **Tasks**: Task oversight and management
- **Features**:
  - Real-time data updates
  - Filtering by SME and date
  - Comprehensive analytics
  - Export capabilities

## 🔐 Security & Access Control

### Authentication Integration
- Seamless integration with existing JWT authentication
- Role-based access control (SME role required)
- Token validation on all API endpoints
- Secure session management

### Data Isolation
- Complete separation between SME and admin data access
- User-specific data filtering
- Session-based task isolation
- Secure API endpoints with proper authorization

## 📊 Business Rules & Workflow

### Session Management Rules
1. **Single Active Session**: Only one active session per SME at any time
2. **Manual Control**: Sessions must be manually started and ended
3. **Task Requirement**: At least one task must be added before session end
4. **Break Tracking**: Automatic calculation of break and lunch times
5. **Time Calculations**: Automatic computation of total and net working time

### Task Management Rules
1. **Session Dependency**: Tasks can only be created during active sessions
2. **User Isolation**: SMEs can only see and manage their own tasks
3. **Status Workflow**: Tasks follow pending → in-progress → completed workflow
4. **Priority System**: Three-level priority system (low, medium, high)

## 🚀 Key Features

### For SME Users
- **Simple Dashboard**: Clean, intuitive interface for daily work tracking
- **Session Controls**: Easy start/stop, break, and lunch management
- **Task Management**: Create, update, and track daily tasks
- **Time Tracking**: Real-time display of work time and breaks
- **History Access**: View past sessions and performance

### For Administrators
- **Comprehensive Monitoring**: Full oversight of all SME activities
- **Analytics Dashboard**: System-wide statistics and trends
- **Individual Tracking**: Detailed view of each SME's performance
- **Filtering & Search**: Advanced filtering by date, SME, and status
- **Export Capabilities**: Data export for reporting and analysis

## 🔧 Technical Specifications

### Technology Stack
- **Frontend**: Next.js 14 with React hooks
- **Backend**: Next.js API routes
- **Database**: MongoDB with Mongoose ODM
- **Authentication**: JWT-based authentication
- **Styling**: Bootstrap 5 with custom CSS
- **Icons**: Bootstrap Icons

### Performance Optimizations
- **Database Indexing**: Compound indexes for efficient queries
- **Real-time Updates**: Optimized polling for live data
- **Lazy Loading**: Component-based loading for better performance
- **Caching**: Strategic caching for frequently accessed data

### Mobile Compatibility
- **Responsive Design**: Mobile-first approach
- **Touch-friendly**: Optimized for touch interactions
- **Progressive Enhancement**: Works across all device types

## 📈 Analytics & Reporting

### Available Metrics
- **Session Analytics**: Total sessions, active sessions, completion rates
- **Time Tracking**: Working hours, break time, productivity metrics
- **Task Analytics**: Task completion rates, priority distribution
- **User Performance**: Individual SME statistics and trends

### Reporting Features
- **Real-time Dashboards**: Live data visualization
- **Historical Analysis**: Trend analysis over time
- **Comparative Reports**: SME performance comparisons
- **Export Options**: Data export for external analysis

## 🔄 Integration Points

### Existing System Integration
- **User Management**: Integrates with existing User model
- **Authentication**: Uses existing JWT authentication system
- **Role System**: Extends existing role-based access control
- **Navigation**: Seamlessly integrated into admin panel navigation

### Future Extensibility
- **API-First Design**: RESTful APIs for future integrations
- **Modular Architecture**: Easy to extend with new features
- **Database Schema**: Flexible schema for future enhancements
- **Component-Based UI**: Reusable components for consistency

## 📋 File Structure

```
src/
├── models/
│   ├── SMESession.js          # Session data model
│   └── SMETask.js             # Task data model
├── app/
│   ├── components/
│   │   └── SMELayout.js       # SME portal layout
│   ├── sme/                   # SME portal pages
│   │   ├── page.js            # Dashboard
│   │   ├── sessions/page.js   # Session history
│   │   └── tasks/page.js      # Task management
│   ├── admin/
│   │   └── sme-monitoring/    # Admin monitoring
│   │       └── page.js
│   └── api/
│       ├── sme/               # SME APIs
│       │   ├── session/route.js
│       │   └── tasks/route.js
│       └── admin/
│           └── sme/route.js   # Admin monitoring API
```

## 🎯 Success Metrics

### System Performance
- **Response Time**: < 200ms for API calls
- **Uptime**: 99.9% availability
- **Scalability**: Supports 100+ concurrent SME users
- **Data Integrity**: 100% accurate time calculations

### User Experience
- **Ease of Use**: Intuitive interface requiring minimal training
- **Mobile Compatibility**: Full functionality on mobile devices
- **Real-time Updates**: Live data refresh every minute
- **Error Handling**: Comprehensive error messages and recovery

### Business Value
- **Time Tracking Accuracy**: Precise work time calculations
- **Productivity Insights**: Detailed analytics for performance optimization
- **Compliance**: Audit trail for work time tracking
- **Scalability**: Easy addition of new SME users and features