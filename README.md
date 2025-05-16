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

## Installation

Deploy the component to your Salesforce org using Salesforce DX or the Metadata API.

### Prerequisites

- Salesforce org with Lightning Experience enabled
- API version 59.0 or later

### Deployment

1. Deploy the Lightning Web Component files:
   - `GanttChart.js`
   - `GanttChart.html`
   - `GanttChart.css`
   - `GanttChart.js-meta.xml`

2. Deploy the Apex controller:
   - `GanttChartController.cls`

3. Deploy the custom object for storing configurations:
   - `GanttChartConfiguration__c.object-meta.xml`
   - `Configuration__c.field-meta.xml`

## Usage

1. Add the component to any Lightning page using the Lightning App Builder
2. Configure the component properties:
   - Chart Height
   - Show/Hide Filters
   - Show/Hide Controls
   - Default Zoom Level

3. When the component loads:
   - Click "Configure" to set up the Gantt chart
   - Select an object and required fields
   - Click "Apply" to load the data

## Configuration Options

The component can be customized with the following settings:

- **Object Selection**: Choose any standard or custom object
- **Required Fields**:
  - Start Date Field: Date/DateTime field for the start of each Gantt bar
  - End Date Field: Date/DateTime field for the end of each Gantt bar
  - Title Field: Text field to display on each Gantt bar
- **Optional Fields**:
  - Color Field: Field to determine Gantt bar color
  - Additional Fields: Fields to display in the tooltip

## Customization

The component can be further customized by modifying the CSS variables defined in `GanttChart.css`.

## Best Practices

- Use indexed date fields for better performance
- Limit the date range to reasonable periods for better loading times
- For large datasets, add additional filters in a customized version of the Apex controller

## Example Use Cases

1. **Project Management**:
   - Object: Project__c
   - Start Date: Start_Date__c
   - End Date: End_Date__c
   - Title: Name
   - Color: Status__c

2. **Event Calendar**:
   - Object: Event
   - Start Date: StartDateTime
   - End Date: EndDateTime
   - Title: Subject
   - Color: Type__c

3. **Case Management**:
   - Object: Case
   - Start Date: CreatedDate
   - End Date: ClosedDate
   - Title: Subject
   - Color: Priority