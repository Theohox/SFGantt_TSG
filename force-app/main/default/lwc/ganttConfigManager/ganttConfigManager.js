import { LightningElement, track } from 'lwc';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';
import getObjects from '@salesforce/apex/GanttChartController.getObjects';
import getObjectFields from '@salesforce/apex/GanttChartController.getObjectFields';
import saveConfiguration from '@salesforce/apex/GanttChartController.saveConfiguration';
import getConfiguration from '@salesforce/apex/GanttChartController.getConfiguration';

export default class GanttConfigManager extends LightningElement {
    @track configurations = [];
    @track selectedConfig = null;
    @track objectOptions = [];
    @track dateFieldOptions = [];
    @track textFieldOptions = [];
    @track referenceFieldOptions = [];
    @track colorFieldOptions = [];
    @track isLoading = false;
    
    connectedCallback() {
        this.loadObjects();
        this.loadConfigurations();
    }
    
    loadObjects() {
        this.isLoading = true;
        getObjects()
            .then(result => {
                this.objectOptions = result.map(obj => ({
                    label: obj.label,
                    value: obj.apiName
                }));
                this.isLoading = false;
            })
            .catch(error => {
                this.handleError(error);
            });
    }
    
    loadConfigurations() {
        getConfiguration()
            .then(result => {
                this.configurations = result.map(config => ({
                    id: config.id,
                    name: config.label,
                    ...JSON.parse(config.configData),
                    className: 'slds-text-link'
                }));
            })
            .catch(error => {
                this.handleError(error);
            });
    }
    
    handleNewConfig() {
        this.selectedConfig = {
            name: 'New Configuration',
            objectApiName: '',
            startDateField: '',
            endDateField: '',
            labelField: '',
            parentField: '',
            colorField: ''
        };
    }
    
    handleConfigSelect(event) {
        const configId = event.currentTarget.dataset.id;
        this.selectedConfig = { ...this.configurations.find(c => c.id === configId) };
        this.loadFields();
    }
    
    handleObjectChange(event) {
        this.selectedConfig = { 
            ...this.selectedConfig, 
            objectApiName: event.detail.value 
        };
        this.loadFields();
    }
    
    loadFields() {
        if (!this.selectedConfig?.objectApiName) return;
        
        this.isLoading = true;
        getObjectFields({ objectApiName: this.selectedConfig.objectApiName })
            .then(result => {
                // Filter fields by type
                this.dateFieldOptions = result
                    .filter(field => field.dataType === 'DATE' || field.dataType === 'DATETIME')
                    .map(this.mapFieldToOption);
                
                this.textFieldOptions = result
                    .filter(field => field.dataType === 'STRING' || field.dataType === 'TEXT' || 
                                   field.dataType === 'PICKLIST')
                    .map(this.mapFieldToOption);
                
                this.referenceFieldOptions = result
                    .filter(field => field.dataType === 'REFERENCE')
                    .map(this.mapFieldToOption);
                
                this.colorFieldOptions = result
                    .filter(field => field.dataType === 'STRING' || field.dataType === 'PICKLIST')
                    .map(this.mapFieldToOption);
                
                this.isLoading = false;
            })
            .catch(error => {
                this.handleError(error);
            });
    }
    
    mapFieldToOption(field) {
        return {
            label: field.label,
            value: field.apiName
        };
    }
    
    handleNameChange(event) {
        this.selectedConfig.name = event.detail.value;
    }
    
    handleStartFieldChange(event) {
        this.selectedConfig.startDateField = event.detail.value;
    }
    
    handleEndFieldChange(event) {
        this.selectedConfig.endDateField = event.detail.value;
    }
    
    handleLabelFieldChange(event) {
        this.selectedConfig.labelField = event.detail.value;
    }
    
    handleParentFieldChange(event) {
        this.selectedConfig.parentField = event.detail.value;
    }
    
    handleColorFieldChange(event) {
        this.selectedConfig.colorField = event.detail.value;
    }
    
    handleSave() {
        if (!this.validateConfig()) {
            return;
        }
        
        this.isLoading = true;
        saveConfiguration({ 
            configStr: JSON.stringify(this.selectedConfig)
        })
            .then(() => {
                this.showToast('Success', 'Configuration saved successfully', 'success');
                this.loadConfigurations();
                this.selectedConfig = null;
                this.isLoading = false;
            })
            .catch(error => {
                this.handleError(error);
            });
    }
    
    handleCancel() {
        this.selectedConfig = null;
    }
    
    validateConfig() {
        const config = this.selectedConfig;
        if (!config.name || !config.objectApiName || 
            !config.startDateField || !config.endDateField || 
            !config.labelField) {
            this.showToast('Error', 'Please fill in all required fields', 'error');
            return false;
        }
        return true;
    }
    
    showToast(title, message, variant) {
        this.dispatchEvent(
            new ShowToastEvent({
                title,
                message,
                variant
            })
        );
    }
    
    handleError(error) {
        this.isLoading = false;
        this.showToast(
            'Error',
            error.body?.message || error.message || 'Unknown error',
            'error'
        );
    }
    
    get hasObjectSelected() {
        return !!this.selectedConfig?.objectApiName;
    }
}