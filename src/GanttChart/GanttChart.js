import { LightningElement, api, track, wire } from 'lwc';
import { getObjectInfo } from 'lightning/uiObjectInfoApi';
import { getPicklistValues } from 'lightning/uiObjectInfoApi';
import { getRecord, getFieldValue } from 'lightning/uiRecordApi';
import { NavigationMixin } from 'lightning/navigation';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';

// Import Apex methods
import getObjects from '@salesforce/apex/GanttChartController.getObjects';
import getObjectFields from '@salesforce/apex/GanttChartController.getObjectFields';
import getRecords from '@salesforce/apex/GanttChartController.getRecords';
import saveConfiguration from '@salesforce/apex/GanttChartController.saveConfiguration';
import getConfiguration from '@salesforce/apex/GanttChartController.getConfiguration';

export default class GanttChart extends NavigationMixin(LightningElement) {
    @api recordId;
    @api objectApiName;
    @api height = '500px';
    @api showFilters = true;
    @api showControls = true;
    @api defaultZoom = 'month';
    
    @track selectedObject;
    @track availableObjects = [];
    @track objectFields = [];
    @track selectedStartDateField;
    @track selectedEndDateField;
    @track selectedTitleField;
    @track selectedColorField;
    @track additionalFields = [];
    @track records = [];
    @track error;
    @track isLoading = true;
    @track zoom = 'month';
    @track startDate;
    @track endDate;
    @track viewStartDate;
    @track viewEndDate;
    @track configuration = {};
    @track showConfiguration = false;
    @track savedConfigurations = [];
    
    zoomOptions = [
        { label: 'Day', value: 'day' },
        { label: 'Week', value: 'week' },
        { label: 'Month', value: 'month' },
        { label: 'Quarter', value: 'quarter' },
        { label: 'Year', value: 'year' }
    ];
    
    connectedCallback() {
        this.zoom = this.defaultZoom;
        this.loadAvailableObjects();
        this.loadSavedConfigurations();
        
        // Set default date range (today to 30 days from now)
        const today = new Date();
        this.startDate = today.toISOString().split('T')[0];
        
        const futureDate = new Date();
        futureDate.setDate(today.getDate() + 30);
        this.endDate = futureDate.toISOString().split('T')[0];
        
        this.viewStartDate = this.startDate;
        this.viewEndDate = this.endDate;
    }
    
    loadAvailableObjects() {
        this.isLoading = true;
        getObjects()
            .then(result => {
                this.availableObjects = result.map(obj => ({
                    label: obj.label,
                    value: obj.apiName
                }));
                this.isLoading = false;
            })
            .catch(error => {
                this.error = this.reduceError(error);
                this.showToast('Error', this.error, 'error');
                this.isLoading = false;
            });
    }
    
    loadSavedConfigurations() {
        getConfiguration()
            .then(result => {
                this.savedConfigurations = result;
            })
            .catch(error => {
                this.error = this.reduceError(error);
                this.showToast('Error', this.error, 'error');
            });
    }
    
    handleObjectChange(event) {
        this.selectedObject = event.detail.value;
        this.loadObjectFields();
    }
    
    loadObjectFields() {
        this.isLoading = true;
        getObjectFields({ objectApiName: this.selectedObject })
            .then(result => {
                this.objectFields = result.map(field => ({
                    label: field.label,
                    value: field.apiName,
                    dataType: field.dataType
                }));
                
                // Filter date fields for start/end date selection
                this.dateFields = this.objectFields.filter(field => 
                    field.dataType === 'Date'
                );
                
                // Filter text fields for title selection
                this.textFields = this.objectFields.filter(field => 
                    field.dataType === 'String' || field.dataType === 'Text' || 
                    field.dataType === 'Picklist' || field.dataType === 'Reference'
                );
                
                this.isLoading = false;
            })
            .catch(error => {
                this.error = this.reduceError(error);
                this.showToast('Error', this.error, 'error');
                this.isLoading = false;
            });
    }
    
    handleStartDateFieldChange(event) {
        this.selectedStartDateField = event.detail.value;
        this.validateConfiguration();
    }
    
    handleEndDateFieldChange(event) {
        this.selectedEndDateField = event.detail.value;
        this.validateConfiguration();
    }
    
    handleTitleFieldChange(event) {
        this.selectedTitleField = event.detail.value;
        this.validateConfiguration();
    }
    
    handleColorFieldChange(event) {
        this.selectedColorField = event.detail.value;
    }
    
    handleAdditionalFieldsChange(event) {
        this.additionalFields = event.detail.value;
    }
    
    validateConfiguration() {
        return this.selectedObject && this.selectedStartDateField && 
               this.selectedEndDateField && this.selectedTitleField;
    }
    
    handleApplyConfiguration() {
        if (this.validateConfiguration()) {
            this.loadRecords();
            this.showConfiguration = false;
        } else {
            this.showToast('Error', 'Please select all required fields', 'error');
        }
    }
    
    handleSaveConfiguration() {
        if (this.validateConfiguration()) {
            const configName = prompt('Enter a name for this configuration:');
            if (configName) {
                const config = {
                    name: configName,
                    objectApiName: this.selectedObject,
                    startDateField: this.selectedStartDateField,
                    endDateField: this.selectedEndDateField,
                    titleField: this.selectedTitleField,
                    colorField: this.selectedColorField,
                    additionalFields: this.additionalFields
                };
                
                saveConfiguration({ configStr: JSON.stringify(config) })
                    .then(() => {
                        this.showToast('Success', 'Configuration saved', 'success');
                        this.loadSavedConfigurations();
                    })
                    .catch(error => {
                        this.error = this.reduceError(error);
                        this.showToast('Error', this.error, 'error');
                    });
            }
        } else {
            this.showToast('Error', 'Please select all required fields', 'error');
        }
    }
    
    handleLoadConfiguration(event) {
        const configId = event.detail.value;
        const config = this.savedConfigurations.find(c => c.id === configId);
        
        if (config) {
            this.selectedObject = config.objectApiName;
            this.loadObjectFields();
            
            // Need to wait for fields to load before setting selected fields
            setTimeout(() => {
                this.selectedStartDateField = config.startDateField;
                this.selectedEndDateField = config.endDateField;
                this.selectedTitleField = config.titleField;
                this.selectedColorField = config.colorField;
                this.additionalFields = config.additionalFields || [];
                this.loadRecords();
            }, 1000);
        }
    }
    
    loadRecords() {
        if (!this.validateConfiguration()) {
            return;
        }
        
        this.isLoading = true;
        const fieldList = [
            this.selectedStartDateField,
            this.selectedEndDateField,
            this.selectedTitleField
        ];
        
        if (this.selectedColorField) {
            fieldList.push(this.selectedColorField);
        }
        
        if (this.additionalFields && this.additionalFields.length) {
            fieldList.push(...this.additionalFields);
        }
        
        getRecords({
            objectApiName: this.selectedObject,
            fields: fieldList,
            startDateField: this.selectedStartDateField,
            endDateField: this.selectedEndDateField,
            startDate: this.startDate,
            endDate: this.endDate
        })
        .then(result => {
            this.records = this.processRecords(result);
            this.isLoading = false;
            this.renderGanttChart();
        })
        .catch(error => {
            this.error = this.reduceError(error);
            this.showToast('Error', this.error, 'error');
            this.isLoading = false;
        });
    }
    
    processRecords(data) {
        return data.map(record => {
            const startDate = new Date(record[this.selectedStartDateField]);
            const endDate = new Date(record[this.selectedEndDateField]);
            
            return {
                id: record.Id,
                title: record[this.selectedTitleField],
                start: startDate,
                end: endDate,
                color: this.selectedColorField ? record[this.selectedColorField] : null,
                record: record
            };
        });
    }
    
    renderGanttChart() {
        const container = this.template.querySelector('.gantt-chart-container');
        if (!container) return;
        
        // Clear previous chart
        while (container.firstChild) {
            container.removeChild(container.firstChild);
        }
        
        // Generate timeline based on zoom level and date range
        this.generateTimeline();
        
        // Render records
        this.records.forEach(record => {
            this.renderGanttBar(record);
        });
    }
    
    generateTimeline() {
        // Implementation for timeline generation
    }
    
    renderGanttBar(record) {
        // Implementation for rendering Gantt bars
    }
    
    handleZoomChange(event) {
        this.zoom = event.detail.value;
        this.renderGanttChart();
    }
    
    handleDateRangeChange(event) {
        this.startDate = event.detail.startDate;
        this.endDate = event.detail.endDate;
        this.loadRecords();
    }
    
    handleRecordClick(event) {
        const recordId = event.currentTarget.dataset.id;
        
        this[NavigationMixin.Navigate]({
            type: 'standard__recordPage',
            attributes: {
                recordId: recordId,
                objectApiName: this.selectedObject,
                actionName: 'view'
            }
        });
    }
    
    handleConfigurationToggle() {
        this.showConfiguration = !this.showConfiguration;
    }
    
    handlePanLeft() {
        // Implementation for panning left
    }
    
    handlePanRight() {
        // Implementation for panning right
    }
    
    handleTodayView() {
        const today = new Date();
        this.viewStartDate = this.calculateViewStartDate(today);
        this.viewEndDate = this.calculateViewEndDate(today);
        this.renderGanttChart();
    }
    
    calculateViewStartDate(date) {
        return date.toISOString().split('T')[0];
    }
    
    calculateViewEndDate(date) {
        const endDate = new Date(date);
        
        switch (this.zoom) {
            case 'day':
                endDate.setDate(date.getDate() + 1);
                break;
            case 'week':
                endDate.setDate(date.getDate() + 7);
                break;
            case 'month':
                endDate.setMonth(date.getMonth() + 1);
                break;
            case 'quarter':
                endDate.setMonth(date.getMonth() + 3);
                break;
            case 'year':
                endDate.setFullYear(date.getFullYear() + 1);
                break;
            default:
                endDate.setMonth(date.getMonth() + 1);
        }
        
        return endDate.toISOString().split('T')[0];
    }
    
    showToast(title, message, variant) {
        this.dispatchEvent(
            new ShowToastEvent({
                title: title,
                message: message,
                variant: variant
            })
        );
    }
    
    reduceError(error) {
        if (typeof error === 'string') {
            return error;
        }
        
        if (Array.isArray(error.body)) {
            return error.body.map(e => e.message).join(', ');
        }
        
        else if (error.body && typeof error.body.message === 'string') {
            return error.body.message;
        }
        
        else if (typeof error.message === 'string') {
            return error.message;
        }
        
        return 'Unknown error';
    }
}