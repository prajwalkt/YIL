// app/library/hypervProvider.ts
import { exec } from 'child_process';
import { promisify } from 'util';
import { VirtualMachineProvider, VMStatus } from './vmProvider';

const execAsync = promisify(exec);

/**
 * HyperVProvider implements VirtualMachineProvider using local PowerShell commands.
 * This is designed for the local testing phase where Hyper-V runs on the host machine.
 */
export class HyperVProvider extends VirtualMachineProvider {
  
  // Helper to execute PowerShell commands securely (no user input passed directly to script)
  private async runPS(command: string): Promise<string> {
    try {
      const { stdout } = await execAsync(`powershell.exe -Command "${command}"`);
      return stdout.trim();
    } catch (error) {
      console.error(`Hyper-V Command Failed: ${command}`, error);
      throw error;
    }
  }

  async startVM(vmName: string): Promise<boolean> {
    try {
      // Validate vmName to prevent injection
      if (!/^[a-zA-Z0-9-_]+$/.test(vmName)) throw new Error('Invalid VM Name');
      await this.runPS(`Start-VM -Name '${vmName}'`);
      return true;
    } catch (error) {
      return false;
    }
  }

  async stopVM(vmName: string): Promise<boolean> {
    try {
      if (!/^[a-zA-Z0-9-_]+$/.test(vmName)) throw new Error('Invalid VM Name');
      await this.runPS(`Stop-VM -Name '${vmName}' -Force`);
      return true;
    } catch (error) {
      return false;
    }
  }

  async resetVM(vmName: string): Promise<boolean> {
    try {
      if (!/^[a-zA-Z0-9-_]+$/.test(vmName)) throw new Error('Invalid VM Name');
      // For Hyper-V, "resetting" means restoring a specific checkpoint
      // Assuming a standard checkpoint named 'CleanState' exists for each VM
      await this.runPS(`Restore-VMSnapshot -VMName '${vmName}' -Name 'CleanState' -Confirm:$false`);
      return true;
    } catch (error) {
      return false;
    }
  }

  async getVMStatus(vmName: string): Promise<VMStatus> {
    try {
      if (!/^[a-zA-Z0-9-_]+$/.test(vmName)) throw new Error('Invalid VM Name');
      const state = await this.runPS(`(Get-VM -Name '${vmName}').State`);
      
      switch (state.toLowerCase()) {
        case 'running': return 'IN_USE'; // or 'STARTING' depending on transition
        case 'off': return 'AVAILABLE';
        case 'saved': return 'AVAILABLE';
        default: return 'ERROR';
      }
    } catch (error) {
      return 'ERROR';
    }
  }
}

// Export a singleton instance
export const hyperVProvider = new HyperVProvider();
