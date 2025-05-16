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

## Component Availability

The component can be used in various Salesforce contexts:

- Lightning App Pages
- Lightning Record Pages
- Lightning Home Pages
- Lightning Tabs
- Lightning Utility Bar
- Lightning Flow Screens
- Lightning Quick Actions
- Lightning Communities/Experience Pages

## Installation

### Prerequisites

- Salesforce org with Lightning Experience enabled
- API version 59.0 or later

### Manual Installation Steps

1. Create the Custom Object:
   - From Setup, go to Object Manager
   - Create a new custom object named "Gantt Chart Configuration"
   - API Name: Gantt_Chart_Configuration__c
   - Add a long text field named "Configuration" (API: Configuration__c)

2. Create the Apex Controller:
   - From Setup, go to Developer Console
   - Create a new Apex Class named "GanttChartController"
   - Copy the content from GanttChartController.cls
   - Save the class

3. Create the LWC Component:
   - From Setup, go to Developer Console
   - Create a new Lightning Web Component named "ganttChart"
   - Create the following files:
     - ganttChart.js (JavaScript controller)
     - ganttChart.html (Template)
     - ganttChart.css (Styles)
     - ganttChart.js-meta.xml (Configuration)

4. Deploy to Production:
   - Test in a sandbox environment first
   - Create a change set including:
     - Gantt_Chart_Configuration__c custom object
     - Configuration__c custom field
     - GanttChartController Apex class
     - ganttChart LWC component bundle
   - Deploy the change set to production

## Configuration Options

### Component Properties

- **Chart Height**: Set the height of the Gantt chart (default: 500px)
- **Show Filters**: Toggle filter controls visibility (default: true)
- **Show Controls**: Toggle navigation controls visibility (default: true)
- **Default Zoom Level**: Set initial zoom level (default: month)
  - Options: day, week, month, quarter, year

### Object and Field Selection

- **Object Selection**: Choose any standard or custom object
- **Required Fields**:
  - Start Date Field: Date field for the start of each Gantt bar
  - End Date Field: Date field for the end of each Gantt bar
  - Title Field: Text field to display on each Gantt bar
- **Optional Fields**:
  - Color Field: Field to determine Gantt bar color
  - Additional Fields: Fields to display in the tooltip

### Flow Screen Configuration

When used in Flow Screens, additional properties are available:
- Input Parameters:
  - Selected Object
  - Start Date Field
  - End Date Field
  - Title Field
- Output Parameters:
  - Selected Records (array of record IDs)

## Usage Examples

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

## Best Practices

- Use indexed date fields for better performance
- Limit the date range to reasonable periods
- Consider record visibility and sharing rules
- Test with various screen sizes for responsive behavior
- Validate field selections before saving configurations

## Security Considerations

- Component respects Salesforce object and field-level security
- Queries are limited to 1000 records for performance
- All database operations use sharing rules
- Configuration storage is user-specific

## Customization

The component can be styled using custom CSS variables defined in ganttChart.css:

```css
--gantt-row-height
--gantt-header-height
--gantt-label-width
--gantt-primary-color
--gantt-grid-color
--gantt-bar-color
--gantt-bar-text
```

## Troubleshooting

Common issues and solutions:
- No records showing: Check date range and field selections
- Performance issues: Reduce date range or add filters
- Display problems: Adjust chart height and zoom level
- Loading errors: Verify field accessibility and permissions