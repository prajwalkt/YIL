// app/library/vmProvider.ts
export type VMStatus = 
  | 'AVAILABLE' 
  | 'PROVISIONING' 
  | 'STARTING' 
  | 'IN_USE' 
  | 'STOPPING' 
  | 'RESETTING' 
  | 'ERROR' 
  | 'MAINTENANCE';

export interface VMInfo {
  vmId: string;
  name: string;
  status: VMStatus;
}

export abstract class VirtualMachineProvider {
  /**
   * Start a specific VM instance
   * @param vmName The name of the VM in the provider
   */
  abstract startVM(vmName: string): Promise<boolean>;

  /**
   * Stop a specific VM instance
   * @param vmName The name of the VM in the provider
   */
  abstract stopVM(vmName: string): Promise<boolean>;

  /**
   * Reset a specific VM instance to its clean template state
   * @param vmName The name of the VM in the provider
   */
  abstract resetVM(vmName: string): Promise<boolean>;

  /**
   * Get the current status of the VM from the provider
   * @param vmName The name of the VM in the provider
   */
  abstract getVMStatus(vmName: string): Promise<VMStatus>;
}
