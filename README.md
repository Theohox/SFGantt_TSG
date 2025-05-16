# Salesforce Dynamic Gantt Chart LWC

A flexible Lightning Web Component (LWC) for Salesforce that displays Gantt charts for any standard or custom object with date fields. This component allows users to customize which objects and fields are displayed in the Gantt chart.

## Features

- Select any standard or custom Salesforce object
- Configure start date, end date, and title fields
- Optional color coding based on field values
- Interactive drag-and-drop for timeline adjustments
- Customizable zoom levels (day, week, month, quarter, year)
- Save and load configurations for different use cases
- Responsive design that works on all devices
- Quick access to record details
- Context-aware object selection based on record relationships
- Support for multiple component targets (App Pages, Record Pages, Flow Screens, etc.)
- Automatic date field type detection and filtering
- Configuration Manager app for easy setup and management

## Installation

### Prerequisites

- Salesforce org with Lightning Experience enabled
- API version 59.0 or later

### Deployment Steps

1. Deploy the metadata components:
   ```bash
   sfdx force:source:deploy -p force-app/main/default
   ```

2. Assign permissions:
   - Go to Setup → Permission Sets
   - Create a new Permission Set:
     - Label: Gantt Chart Manager
     - API Name: Gantt_Chart_Manager
   - Add these object permissions:
     - Gantt Chart Configuration: Read, Create, Edit, Delete
   - Add tab access:
     - Gantt Chart Configurations: Available
   - Assign the permission set to users

### Configuration Manager

1. Access the Configuration Manager:
   - Open the App Launcher
   - Find and click "Gantt Chart Manager"
   - The configuration interface will open

2. Create a new configuration:
   - Click "New Configuration"
   - Fill in the required fields:
     - Configuration Name
     - Object to display
     - Start Date Field
     - End Date Field
     - Label Field
   - Optional fields:
     - Parent Field (for related records)
     - Color Field (for color coding)
   - Click "Save"

3. Using saved configurations:
   - Configurations are available when adding the Gantt Chart to any page
   - Select from saved configurations in the component properties
   - Configurations can be edited or deleted in the manager

## Component Usage

### Adding to Lightning Pages

1. Edit the Lightning page
2. Drag the "Gantt Chart" component to the desired location
3. Configure the component:
   - Select a saved configuration
   - Set the chart height
   - Choose default zoom level
   - Enable/disable filters and controls

### Record Page Setup

1. Edit the record page
2. Add the Gantt Chart component
3. Configure for related records:
   - Select a configuration that uses the parent field
   - The chart will automatically filter to show related records

### Flow Screen Usage

1. Add the Gantt Chart to a Flow screen
2. Set input parameters:
   - Selected configuration
   - Default zoom level
3. Use output parameters:
   - Selected records
   - Date range

## Development

### Project Structure

```
force-app/main/default/
├── applications/
│   └── GanttChartManager.app-meta.xml
├── lwc/
│   ├── ganttChart/
│   │   ├── ganttChart.html
│   │   ├── ganttChart.js
│   │   ├── ganttChart.css
│   │   └── ganttChart.js-meta.xml
│   └── ganttConfigManager/
│       ├── ganttConfigManager.html
│       ├── ganttConfigManager.js
│       ├── ganttConfigManager.css
│       └── ganttConfigManager.js-meta.xml
├── classes/
│   ├── GanttChartController.cls
│   └── GanttChartController.cls-meta.xml
├── objects/
│   └── Gantt_Chart_Configuration__c/
│       ├── Gantt_Chart_Configuration__c.object-meta.xml
│       └── fields/
│           └── Configuration__c.field-meta.xml
└── tabs/
    └── Gantt_Chart_Configurations.tab-meta.xml
```

### Customization

The component can be styled using custom CSS variables:

```css
--gantt-row-height: 40px;
--gantt-header-height: 50px;
--gantt-label-width: 200px;
--gantt-primary-color: #0070D2;
--gantt-grid-color: #DDDBDA;
--gantt-bar-color: #1589EE;
--gantt-bar-text: #FFFFFF;
```

## Best Practices

- Use indexed date fields for better performance
- Create configurations for common use cases
- Test with various screen sizes
- Consider record visibility and sharing rules
- Use meaningful labels for configurations

## Troubleshooting

Common issues and solutions:
- No records showing: Check date range and field selections
- Performance issues: Reduce date range or add filters
- Display problems: Adjust chart height and zoom level
- Loading errors: Verify field accessibility and permissions
- Configuration not saving: Check user permissions