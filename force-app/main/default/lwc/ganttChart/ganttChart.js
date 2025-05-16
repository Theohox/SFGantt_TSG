import { LightningElement, api, track } from 'lwc';
import getObjects from '@salesforce/apex/GanttChartController.getObjects';
import getObjectFields from '@salesforce/apex/GanttChartController.getObjectFields';
import getRecords from '@salesforce/apex/GanttChartController.getRecords';
import saveConfiguration from '@salesforce/apex/GanttChartController.saveConfiguration';
import getConfiguration from '@salesforce/apex/GanttChartController.getConfiguration';

export default class GanttChart extends LightningElement {
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
                this.dispatchEvent(
                    new ShowToastEvent({
                        title: 'Error',
                        message: this.error,
                        variant: 'error'
                    })
                );
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
                this.dispatchEvent(
                    new ShowToastEvent({
                        title: 'Error',
                        message: this.error,
                        variant: 'error'
                    })
                );
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
                
                this.dateFields = this.objectFields.filter(field => 
                    field.dataType === 'Date' || field.dataType === 'DateTime'
                );
                
                this.textFields = this.objectFields.filter(field => 
                    field.dataType === 'String' || field.dataType === 'Text' || 
                    field.dataType === 'Picklist' || field.dataType === 'Reference'
                );
                
                this.isLoading = false;
            })
            .catch(error => {
                this.error = this.reduceError(error);
                this.dispatchEvent(
                    new ShowToastEvent({
                        title: 'Error',
                        message: this.error,
                        variant: 'error'
                    })
                );
                this.isLoading = false;
            });
    }
    
    handleStartDateFieldChange(event) {
        this.selectedStartDateField = event.detail.value;
    }
    
    handleEndDateFieldChange(event) {
        this.selectedEndDateField = event.detail.value;
    }
    
    handleTitleFieldChange(event) {
        this.selectedTitleField = event.detail.value;
    }
    
    handleColorFieldChange(event) {
        this.selectedColorField = event.detail.value;
    }
    
    handleAdditionalFieldsChange(event) {
        this.additionalFields = event.detail.value;
    }
    
    get isConfigurationInvalid() {
        return !(this.selectedObject && this.selectedStartDateField && 
                this.selectedEndDateField && this.selectedTitleField);
    }
    
    handleApplyConfiguration() {
        if (!this.isConfigurationInvalid) {
            this.loadRecords();
            this.showConfiguration = false;
        } else {
            this.dispatchEvent(
                new ShowToastEvent({
                    title: 'Error',
                    message: 'Please select all required fields',
                    variant: 'error'
                })
            );
        }
    }
    
    handleSaveConfiguration() {
        if (!this.isConfigurationInvalid) {
            const config = {
                objectApiName: this.selectedObject,
                startDateField: this.selectedStartDateField,
                endDateField: this.selectedEndDateField,
                titleField: this.selectedTitleField,
                colorField: this.selectedColorField,
                additionalFields: this.additionalFields
            };
            
            saveConfiguration({ configStr: JSON.stringify(config) })
                .then(() => {
                    this.dispatchEvent(
                        new ShowToastEvent({
                            title: 'Success',
                            message: 'Configuration saved successfully',
                            variant: 'success'
                        })
                    );
                    this.loadSavedConfigurations();
                })
                .catch(error => {
                    this.error = this.reduceError(error);
                    this.dispatchEvent(
                        new ShowToastEvent({
                            title: 'Error',
                            message: this.error,
                            variant: 'error'
                        })
                    );
                });
        }
    }
    
    loadRecords() {
        if (this.isConfigurationInvalid) {
            return;
        }
        
        this.isLoading = true;
        const fields = [
            this.selectedStartDateField,
            this.selectedEndDateField,
            this.selectedTitleField,
            ...(this.selectedColorField ? [this.selectedColorField] : []),
            ...this.additionalFields
        ];
        
        getRecords({
            objectApiName: this.selectedObject,
            fields: fields,
            startDateField: this.selectedStartDateField,
            endDateField: this.selectedEndDateField,
            startDate: this.startDate,
            endDate: this.endDate
        })
        .then(result => {
            this.records = this.processRecords(result);
            this.error = undefined;
            this.isLoading = false;
        })
        .catch(error => {
            this.error = this.reduceError(error);
            this.records = [];
            this.isLoading = false;
            this.dispatchEvent(
                new ShowToastEvent({
                    title: 'Error',
                    message: this.error,
                    variant: 'error'
                })
            );
        });
    }
    
    processRecords(records) {
        return records.map(record => {
            const startDate = new Date(record[this.selectedStartDateField]);
            const endDate = new Date(record[this.selectedEndDateField]);
            const duration = this.calculateDuration(startDate, endDate);
            const position = this.calculatePosition(startDate);
            
            return {
                id: record.Id,
                title: record[this.selectedTitleField],
                start: startDate,
                end: endDate,
                style: `left: ${position}%; width: ${duration}%;`,
                color: this.selectedColorField ? record[this.selectedColorField] : null,
                record: record
            };
        });
    }
    
    calculateDuration(start, end) {
        const totalDays = (this.viewEndDate - this.viewStartDate) / (1000 * 60 * 60 * 24);
        const recordDays = (end - start) / (1000 * 60 * 60 * 24);
        return (recordDays / totalDays) * 100;
    }
    
    calculatePosition(date) {
        const totalDays = (this.viewEndDate - this.viewStartDate) / (1000 * 60 * 60 * 24);
        const daysSinceStart = (date - this.viewStartDate) / (1000 * 60 * 60 * 24);
        return (daysSinceStart / totalDays) * 100;
    }
    
    handleConfigurationToggle() {
        this.showConfiguration = !this.showConfiguration;
    }
    
    handleZoomChange(event) {
        this.zoom = event.detail.value;
        this.updateViewDates();
    }
    
    handleStartDateChange(event) {
        this.startDate = event.detail.value;
        this.loadRecords();
    }
    
    handleEndDateChange(event) {
        this.endDate = event.detail.value;
        this.loadRecords();
    }
    
    handlePanLeft() {
        const days = this.getPanDays();
        this.viewStartDate.setDate(this.viewStartDate.getDate() - days);
        this.viewEndDate.setDate(this.viewEndDate.getDate() - days);
        this.loadRecords();
    }
    
    handlePanRight() {
        const days = this.getPanDays();
        this.viewStartDate.setDate(this.viewStartDate.getDate() + days);
        this.viewEndDate.setDate(this.viewEndDate.getDate() + days);
        this.loadRecords();
    }
    
    handleTodayView() {
        const today = new Date();
        this.viewStartDate = this.calculateViewStartDate(today);
        this.viewEndDate = this.calculateViewEndDate(today);
        this.loadRecords();
    }
    
    getPanDays() {
        switch (this.zoom) {
            case 'day': return 1;
            case 'week': return 7;
            case 'month': return 30;
            case 'quarter': return 90;
            case 'year': return 365;
            default: return 30;
        }
    }
    
    calculateViewStartDate(date) {
        const startDate = new Date(date);
        switch (this.zoom) {
            case 'day':
                startDate.setHours(0, 0, 0, 0);
                break;
            case 'week':
                startDate.setDate(startDate.getDate() - startDate.getDay());
                break;
            case 'month':
                startDate.setDate(1);
                break;
            case 'quarter':
                startDate.setMonth(Math.floor(startDate.getMonth() / 3) * 3);
                startDate.setDate(1);
                break;
            case 'year':
                startDate.setMonth(0, 1);
                break;
        }
        return startDate;
    }
    
    calculateViewEndDate(date) {
        const endDate = this.calculateViewStartDate(date);
        switch (this.zoom) {
            case 'day':
                endDate.setDate(endDate.getDate() + 1);
                break;
            case 'week':
                endDate.setDate(endDate.getDate() + 7);
                break;
            case 'month':
                endDate.setMonth(endDate.getMonth() + 1);
                break;
            case 'quarter':
                endDate.setMonth(endDate.getMonth() + 3);
                break;
            case 'year':
                endDate.setFullYear(endDate.getFullYear() + 1);
                break;
        }
        return endDate;
    }
    
    get chartStyle() {
        return `height: ${this.height};`;
    }
    
    reduceError(error) {
        if (typeof error === 'string') {
            return error;
        }
        if (Array.isArray(error.body)) {
            return error.body.map(e => e.message).join(', ');
        }
        if (typeof error.body?.message === 'string') {
            return error.body.message;
        }
        return 'Unknown error';
    }
}