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

  // Xavier
  title: string;
  _rendered_title?: string;
  icon: string;
  _rendered_icon?: string;
  subtitle: string;
  _rendered_subtitle?: string;

  hide_condition: string;
  _rendered_hide_condition?: boolean;

  large: boolean;
  background_color?: string;
  font_color?: string;
}
