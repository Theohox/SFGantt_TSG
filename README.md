# Salesforce Gantt Chart LWC

A Lightning Web Component (LWC) that displays a configurable Gantt chart for any Salesforce object with date fields.

## Features

- Select any standard or custom Salesforce object
- Configure start date, end date, and title fields
- Optional color coding based on field values
- Interactive drag-and-drop for timeline adjustments
- Customizable zoom levels (day, week, month, quarter, year)
- Save and load configurations
- Responsive design
- Quick access to record details

## Setup Instructions

1. Deploy the components to your Salesforce org:
   - GanttChart LWC component
   - GanttChartController Apex class
   - Gantt_Chart_Configuration__c custom object

2. Add the component to your Lightning pages through the Lightning App Builder

3. Configure the component by selecting:
   - Object to display
   - Start date field
   - End date field
   - Title field
   - Optional color field
   - Additional fields to display in tooltips

## Development

This project is built using:
- Lightning Web Components
- Apex
- Custom Objects for configuration storage

### Project Structure

```
force-app/main/default/
├── lwc/
│   └── ganttChart/
│       ├── ganttChart.html
│       ├── ganttChart.js
│       ├── ganttChart.css
│       └── ganttChart.js-meta.xml
├── classes/
│   └── GanttChartController.cls
└── objects/
    └── Gantt_Chart_Configuration__c/
        ├── Gantt_Chart_Configuration__c.object-meta.xml
        └── fields/
            └── Configuration__c.field-meta.xml
```