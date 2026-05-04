export class CreateThermalDto {
  device_id: string;
  cpu?: number;
  gpu?: number;
  battery?: number;
  skin?: number;
  power_amplifier?: number;
  npu?: number;
}