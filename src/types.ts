import { ActionConfig } from 'custom-card-helpers';

// TODO Add your configuration elements here for type-checking
export interface BoilerplateCardConfig {
  type: string;
  name?: string;
  show_warning?: boolean;
  show_error?: boolean;
  test_gui?: boolean;
  entity?: string;
  tap_action?: ActionConfig;
  hold_action?: ActionConfig;
  double_tap_action?: ActionConfig;

  // Specific for button-text-card

  background_color?: string;
  font_color?: string;
  height: string;
  hide_condition: boolean;
  icon: string;
  icon_animation?: 'spin';
  icon_color: string;
  icon_size: number;
  large: boolean;
  title: string;
  subtitle: string;
  width: string;
}
