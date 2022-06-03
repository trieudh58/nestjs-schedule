"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
const common_1 = require("@nestjs/common");
const core_1 = require("@nestjs/core");
const metadata_scanner_1 = require("@nestjs/core/metadata-scanner");
const scheduler_type_enum_1 = require("./enums/scheduler-type.enum");
const schedule_metadata_accessor_1 = require("./schedule-metadata.accessor");
const scheduler_orchestrator_1 = require("./scheduler.orchestrator");
let ScheduleExplorer = class ScheduleExplorer {
    constructor(schedulerOrchestrator, discoveryService, metadataAccessor, metadataScanner) {
        this.schedulerOrchestrator = schedulerOrchestrator;
        this.discoveryService = discoveryService;
        this.metadataAccessor = metadataAccessor;
        this.metadataScanner = metadataScanner;
    }
    onModuleInit() {
        this.explore();
    }
    explore() {
        const providers = this.discoveryService.getProviders();
        providers.forEach((wrapper) => {
            const { instance } = wrapper;
            if (!instance) {
                return;
            }
            this.metadataScanner.scanFromPrototype(instance, Object.getPrototypeOf(instance), (key) => this.lookupSchedulers(instance, key));
        });
    }
    lookupSchedulers(instance, key) {
        const methodRef = instance[key];
        const metadata = this.metadataAccessor.getSchedulerType(methodRef);
        switch (metadata) {
            case scheduler_type_enum_1.SchedulerType.CRON: {
                const cronMetadata = this.metadataAccessor.getCronMetadata(methodRef);
                return this.schedulerOrchestrator.addCron(methodRef.bind(instance), cronMetadata);
            }
            case scheduler_type_enum_1.SchedulerType.TIMEOUT: {
                const timeoutMetadata = this.metadataAccessor.getTimeoutMetadata(methodRef);
                const name = this.metadataAccessor.getSchedulerName(methodRef);
                return this.schedulerOrchestrator.addTimeout(methodRef.bind(instance), timeoutMetadata.timeout, name);
            }
            case scheduler_type_enum_1.SchedulerType.INTERVAL: {
                const intervalMetadata = this.metadataAccessor.getIntervalMetadata(methodRef);
                const name = this.metadataAccessor.getSchedulerName(methodRef);
                return this.schedulerOrchestrator.addInterval(methodRef.bind(instance), intervalMetadata.timeout, name);
            }
        }
    }
};
ScheduleExplorer = __decorate([
    common_1.Injectable(),
    __metadata("design:paramtypes", [scheduler_orchestrator_1.SchedulerOrchestrator,
        core_1.DiscoveryService,
        schedule_metadata_accessor_1.SchedulerMetadataAccessor,
        metadata_scanner_1.MetadataScanner])
], ScheduleExplorer);
exports.ScheduleExplorer = ScheduleExplorer;
