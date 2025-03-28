# PDF Buddy - System Patterns

## Architecture Overview

```mermaid
flowchart TD
    subgraph UI
        BA[Browser Action]
        CM[Context Menu]
        PU[Popup UI]
        OP[Options Page]
    end
    
    subgraph Core
        BG[Background Script]
        CS[Content Script]
        ST[Storage]
    end
    
    subgraph Features
        PDF[PDF Generator]
        WM[Watermark Engine]
        TM[Template Manager]
        LM[License Manager]
    end
    
    BA --> PU
    CM --> BG
    PU --> BG
    OP --> BG
    
    BG --> CS
    BG --> ST
    BG --> PDF
    BG --> WM
    BG --> TM
    BG --> LM
    
    CS --> PDF
    WM --> PDF
    TM --> WM
    LM --> TM
    LM --> WM
```

## Component Responsibilities

### UI Components
- **Browser Action**: Extension icon and popup trigger
- **Context Menu**: Right-click menu integration
- **Popup UI**: Quick access interface for common actions
- **Options Page**: Detailed settings and premium features

### Core Components
- **Background Script**: Central controller and state manager
- **Content Script**: Page interaction and content manipulation
- **Storage**: Settings and template persistence

### Feature Components
- **PDF Generator**: Handles conversion of web content to PDF
- **Watermark Engine**: Manages watermark creation and application
- **Template Manager**: Stores and retrieves watermark templates
- **License Manager**: Handles premium feature access control

## Communication Patterns

```mermaid
sequenceDiagram
    participant User
    participant UI as UI Components
    participant BG as Background Script
    participant CS as Content Script
    participant PDF as PDF Generator
    participant WM as Watermark Engine
    
    User->>UI: Initiates PDF save
    UI->>BG: Sends save request
    BG->>CS: Requests page content
    CS->>BG: Returns processed content
    BG->>WM: Requests watermark
    WM->>BG: Returns watermark config
    BG->>PDF: Sends content + watermark
    PDF->>BG: Returns PDF data
    BG->>User: Delivers PDF file
```

## State Management

```mermaid
stateDiagram-v2
    [*] --> Idle
    
    Idle --> Capturing: User initiates save
    Capturing --> Processing: Content captured
    Processing --> Watermarking: Content processed
    Watermarking --> Generating: Watermark applied
    Generating --> Downloading: PDF generated
    Downloading --> Idle: PDF saved
    
    Capturing --> Error: Capture failed
    Processing --> Error: Process failed
    Watermarking --> Error: Watermark failed
    Generating --> Error: Generation failed
    Downloading --> Error: Download failed
    
    Error --> Idle: Error acknowledged
```

## Design Patterns

### Module Pattern
Used throughout the extension to encapsulate functionality and prevent global namespace pollution.

```javascript
// Example module pattern implementation
const WatermarkEngine = (function() {
    // Private variables
    let templates = [];
    
    // Private methods
    function applyWatermark(content, config) {
        // Implementation
    }
    
    // Public API
    return {
        createWatermark: function(text, options) {
            // Implementation using private methods
        },
        
        getTemplates: function() {
            return [...templates];
        }
    };
})();
```

### Observer Pattern
Used for communication between components, particularly for state changes.

```javascript
// Example observer pattern implementation
const EventBus = (function() {
    const events = {};
    
    return {
        subscribe: function(event, callback) {
            if (!events[event]) events[event] = [];
            events[event].push(callback);
        },
        
        publish: function(event, data) {
            if (!events[event]) return;
            events[event].forEach(callback => callback(data));
        }
    };
})();
```

### Factory Pattern
Used for creating different types of watermarks.

```javascript
// Example factory pattern implementation
const WatermarkFactory = {
    createTextWatermark: function(text, options) {
        // Create text watermark
    },
    
    createImageWatermark: function(imageData, options) {
        // Create image watermark
    }
};
```

### Strategy Pattern
Used for different PDF generation approaches based on content type.

```javascript
// Example strategy pattern implementation
const pdfStrategies = {
    webpage: function(content) {
        // Convert webpage to PDF
    },
    
    document: function(content) {
        // Convert document to PDF
    }
};

function generatePDF(content, type) {
    return pdfStrategies[type](content);
}
```

## Error Handling Strategy

```mermaid
flowchart TD
    E[Error Occurs] --> D{Determine Type}
    
    D -->|User Error| UE[Display Friendly Message]
    D -->|Network Error| NE[Retry with Backoff]
    D -->|Permission Error| PE[Request Permissions]
    D -->|Unknown Error| UN[Log and Report]
    
    UE --> R[Recovery Actions]
    NE --> R
    PE --> R
    UN --> R
    
    R --> L[Log Error Details]
    L --> A[Analytics Tracking]
```

## Performance Considerations
- Lazy loading of premium features
- Efficient DOM manipulation in content scripts
- Throttling of resource-intensive operations
- Caching of frequently used templates
- Optimized watermark rendering

## Security Patterns

```mermaid
flowchart TD
    subgraph Input
        IV[Input Validation]
        IS[Input Sanitization]
        DC[Data Constraints]
    end
    
    subgraph Policy
        CSP[Content Security Policy]
        PM[Permission Management]
        SH[Security Headers]
    end
    
    subgraph Storage
        ES[Encrypted Storage]
        IM[Integrity Monitoring]
        SC[Storage Constraints]
    end
    
    subgraph Communication
        MS[Message Sanitization]
        OV[Origin Validation]
        SMP[Secure Message Passing]
    end
    
    IV --> IS
    IS --> UI[User Interface]
    DC --> IV
    
    CSP --> UI
    CSP --> API[API Calls]
    PM --> API
    SH --> UI
    
    ES --> ST[Storage APIs]
    IM --> ST
    SC --> ST
    
    MS --> COM[Component Communication]
    OV --> COM
    SMP --> COM
```

### Input Security
- **Validation**: All user inputs are validated against predefined patterns and constraints
- **Sanitization**: HTML and script content is sanitized to prevent XSS attacks
- **Type Checking**: Strict type checking is enforced for all function parameters
- **Length Constraints**: Input length limits are enforced to prevent buffer overflow attacks
- **Avoiding Double Sanitization**: Checking if data is already sanitized before applying sanitization to prevent unintended side effects

### Content Security Policy
- **Strict CSP**: Restrictive Content Security Policy to prevent XSS and data injection
- **Resource Restrictions**: Limits on where resources can be loaded from
- **Inline Script Prevention**: Blocking of inline scripts to prevent injection attacks
- **Frame Restrictions**: Control over which contexts can frame the extension pages

### Permission Management
- **Minimal Permissions**: Only requesting permissions that are absolutely necessary
- **Optional Permissions**: Using optional permissions for features that aren't core
- **Just-in-time Requests**: Requesting permissions only when needed for specific features
- **Permission Checking**: Verifying permissions before attempting operations

### Secure Storage
- **Data Validation**: Validation of all data before storage
- **Integrity Checking**: Verification that stored data hasn't been tampered with
- **Sensitive Data Handling**: Special handling for sensitive information
- **Storage Quotas**: Enforcing limits to prevent denial of service attacks

### Secure Communication
- **Message Validation**: Validation of all messages between components
- **Origin Checking**: Verification of message origins
- **Secure Message Passing**: Using Chrome's secure message passing APIs
- **Response Sanitization**: Sanitizing responses before processing

### Error Handling
- **Secure Error Messages**: Not exposing sensitive information in error messages
- **Graceful Degradation**: Failing safely when errors occur
- **Error Logging**: Comprehensive logging for security-related errors
- **Rate Limiting**: Preventing abuse through rate limiting of operations

## Testing Strategy
- Unit tests for core components
- Integration tests for feature workflows
- End-to-end tests for user scenarios
- Performance benchmarking
- Security auditing
