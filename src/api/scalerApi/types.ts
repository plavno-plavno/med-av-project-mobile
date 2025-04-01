export interface IScalerFindFreeMachineResponse {
    ip: string;
    port: string;
    start_time: number;
    httpPort: string;
    dns: string;
    gpuType: string;
    id: number;
    uptime: number;
    actual_status: string;
    clients_number: number;
    rtc: string;
}

export interface IScalerFindFreeMachinePairSTTResponse {
    stt: string;
}