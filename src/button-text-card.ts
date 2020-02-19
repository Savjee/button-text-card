import { LitElement, html, customElement, property, CSSResult, TemplateResult, css, PropertyValues } from 'lit-element';
import {
  HomeAssistant,
  hasConfigOrEntityChanged,
  hasAction,
  ActionHandlerEvent,
  handleAction,
} from 'custom-card-helpers';

import { BoilerplateCardConfig } from './types';
import { actionHandler } from './action-handler-directive';
import { CARD_VERSION } from './const';

/* eslint no-console: 0 */
console.info(
  `%c  BUTTON-TEXT-CARD \n%c  v${CARD_VERSION}    `,
  'color: orange; font-weight: bold; background: black',
  'color: white; font-weight: bold; background: dimgray',
);

// TODO Name your custom element
@customElement('button-text-card')
export class BoilerplateCard extends LitElement {
  // TODO Add any properities that should cause your element to re-render here
  @property() public hass?: HomeAssistant;
  @property() private _config?: BoilerplateCardConfig;

  public setConfig(config: BoilerplateCardConfig): void {
    // TODO Check for required fields and that they are of the proper format
    if (!config || config.show_error) {
      throw new Error('Invalid configuration.');
    }

    this._config = {
      name: 'Button Text Card',
      title: 'Button Text Card Title',
      subtitle: 'Subtitle',
      ...config,
    };
  }

  protected shouldUpdate(changedProps: PropertyValues): boolean {
    if (this._config) {
      const config = this._config;
      const templateSupport = ['title', 'subtitle', 'icon'];
      const promises = templateSupport.map(el => this._renderTemplate(config[el]));

      Promise.all(promises).then(renderedTemplates => {
        let updated = false;

        for (let i = 0; i < templateSupport.length; i++) {
          const key = '_rendered_' + templateSupport[i];
          const newValue = renderedTemplates[i];

          if (config[key] !== newValue) {
            updated = true;
            config[key] = renderedTemplates[i];
            // console.log('key', key, renderedTemplates[i]);
          }
        }

        if (updated) {
          this.setConfig(config);
        }
      });
    }

    return hasConfigOrEntityChanged(this, changedProps, false);
  }

  protected render(): TemplateResult | void {
    if (!this._config || !this.hass) {
      return html``;
    }

    // If no icon was set by the user, try fetching one from HA
    if (!this._config.icon || this._config.icon === '') {
      let icon = 'mdi:alert-circle';

      if (this._config.entity) {
        const hassIcon = this.hass.states[this._config.entity].attributes.icon;
        if (hassIcon) {
          icon = hassIcon;
        }
      }

      this.setConfig({
        ...this._config,
        icon: icon,
        _rendered_icon: icon,
      });
    }

    return html`
      <ha-card
        @action=${this._handleAction}
        .actionHandler=${actionHandler({
          hasHold: hasAction(this._config.hold_action),
          hasDoubleTap: hasAction(this._config.double_tap_action),
          repeat: this._config.hold_action ? this._config.hold_action.repeat : undefined,
        })}
        tabindex="0"
      >
        <div class="flex-container">
          <div class="icon-container">
            <ha-icon icon="${this._config._rendered_icon}"></ha-icon>
          </div>

          <div class="text-container">
            <h1>${this._config._rendered_title}</h1>
            <p class="${this._config.subtitle === '' ? 'hidden' : ''}">${this._config._rendered_subtitle}</p>
          </div>
        </div>
      </ha-card>
    `;
  }

  private _handleAction(ev: ActionHandlerEvent): void {
    if (this.hass && this._config && ev.detail.action) {
      handleAction(this, this.hass, this._config, ev.detail.action);
    }
  }

  private _renderTemplate(template: string | undefined): Promise<string> {
    return new Promise((resolve, _) => {
      if (!template) {
        return resolve('');
      }
      if (template.indexOf('{') == -1) {
        return resolve(template);
      }

      if (this.hass) {
        this.hass.connection.subscribeMessage(
          (output: any) => {
            if (output.result) {
              return resolve(output.result);
            } else {
              return resolve('Could not render template');
            }
          },

          {
            type: 'render_template',
            template: template,
          },
        );
      }
    });
  }

  static get styles(): CSSResult {
    return css`
      ha-card {
        --paper-card-background-color: 'rgba(11, 11, 11, 0.00)';
        box-shadow: 2px 2px rgba(0, 0, 0, 0);
        padding: 16px;
      }
      .warning {
        display: block;
        color: black;
        background-color: #fce588;
        padding: 8px;
      }

      .flex-container {
        width: 100%;
        display: flex;
        align-items: center;
        color: rgb(99, 107, 116);
      }

      .icon-container {
        width: 85px;
        height: 85px;
        margin-right: 24px;
        border-radius: 16px;
        background-color: var(--primary-background-color);
        box-shadow: 9px 9px 17px #c8c8c8, -9px -9px 17px #ffffff;
        display: flex;
        align-items: center;
        justify-content: center;
      }
      .icon-container ha-icon,
      .text-container {
        color: var(--primary-text-color);
      }
      .icon-container ha-icon {
        width: 33px;
        height: 33px;
      }

      .text-container {
        flex: 1;
      }
      .text-container h1 {
        font-size: 21px;
        font-weight: 500;
        margin: 0 0 10px 0;
      }
      .text-container p {
        font-size: 15px;
        font-weight: 400;
        margin: 0;
      }
    `;
  }
}
