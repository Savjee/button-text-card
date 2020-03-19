<p align="center">
  <a href="" rel="noopener">
 <img src="https://savjee.github.io/button-text-card/logo.png" alt="Project logo"></a>
</p>

<h3 align="center">Button Text Card</h3>

<div align="center">
  
  [![hacs_badge](https://img.shields.io/badge/HACS-Custom-orange.svg)](https://github.com/custom-components/hacs)
  [![Build Status](https://github.com/Savjee/button-text-card/workflows/Build/badge.svg)](https://github.com/Savjee/button-text-card/actions?query=workflow%3ABuild)
  [![GitHub Issues](https://img.shields.io/github/issues/Savjee/button-text-card.svg)](https://github.com/Savjee/button-text-card/issues)
  [![GitHub Pull Requests](https://img.shields.io/github/issues-pr/Savjee/button-text-card.svg)](https://github.com/Savjee/button-text-card/pulls)
  [![License](https://img.shields.io/badge/license-MIT-blue.svg)](/LICENSE)

</div>

---

Custom, "neumorphism" card for Home Assistant with support for templating.

# Table of contents
* [Installation instructions](#installation-instructions)
* [Configuration options](#configuration-options)
* [Examples](#examples)
* [Templating](#templating)
* [License & Contributions](#license--contributions)

---

# Installation instructions

1. Open [HACS](https://hacs.xyz/)
2. Go to Settings > Custom Repository
3. Add `https://github.com/Savjee/button-text-card` as plugin
4. Install it
5. Add to your Lovelace config:

```yaml
  - url: /community_plugin/button-text-card/button-text-card.js
    type: module
```

# Configuration options
| Name             | Type    | Requirement | Description                                                  | Default            |
|------------------|---------|-------------|--------------------------------------------------------------|--------------------|
| type             | string  | required    | `custom:button-text-card`                                    | n/a                |
| entity           | string  | optional    | Which entity state you want to use in your card (templating) |                    |
| icon             | string  | optional    | Custom icon for the card                                     | `mdi:alert-circle` |
| title            | string  | optional    |                                                              |                    |
| subtitle         | string  | optional    |                                                              |                    |
| large            | boolean | optional    | Large cards have a full-width container                      | `false`            |
| font_color       | string  | optional    | CSS colorcode for the text                                   | Defined by theme   |
| background_color | string  | optional    | CSS color for the background of the badge                    | Defined by theme   |
| hide_condition   | string  | optional    | Javascript template that defines if card should be hidden    | `false`            |


# Examples

**Basic card with static title, subtitle and custom icon**
<div align="center">
    <img src="https://savjee.github.io/button-text-card/example-1.png">
</div>

```yaml
type: 'custom:button-text-card'
title: Title
subtitle: Subtitle
icon: 'mdi:lightbulb-outline'
```

**Only title**
<div align="center">
    <img src="https://savjee.github.io/button-text-card/example-2.png">
</div>

```yaml
type: 'custom:button-text-card'
title: Only title
icon: 'mdi:format-title'
```

**Large card**
<div align="center">
    <img src="https://savjee.github.io/button-text-card/example-4.png">
</div>

```yaml
type: 'custom:button-text-card'
title: Large version
subtitle: Ideal for important messages
icon: 'mdi:battery-high'
large: true
```

**Custom background & font colors**
<div align="center">
    <img src="https://savjee.github.io/button-text-card/example-5.png">
</div>

```yaml
type: 'custom:button-text-card'
title: Warning!
subtitle: Draw attention with custom colors
icon: 'mdi:comment-alert'
large: true
font_color: '#fff'
background_color: '#A81419'
```

# Templating

For templating, we do **NOT** support Jinja2. Instead we opted to use Javascript as templating language (like [button-card](https://github.com/custom-cards/button-card)). 

Templating is supported in most fields (see [options](#options) for more details). Since these templates are executed in the front-end, there is no impact on the performance of your Home Assistant installation. It does, however, mean that you have to learn some Javascript.

Templates are enclosed by tripple brackets and can contain any valid Javascript: `[[[ return "Hello from Javascript!" ]]]`

**Example: counting people home**
<div align="center">
    <img src="https://savjee.github.io/button-text-card/example-3.png">
</div>

```yaml
type: 'custom:button-text-card'
icon: >
  [[[
    const count = Object.entries(states).filter(e => e[0].indexOf('person.') === 0 && e[1].state === "home").length;

    if(count === 0){
      return "mdi:home-export-outline";
    }else{
      return "mdi:home-import-outline";
    }
  ]]]
title: |
  [[[
    const count = Object.entries(states).filter(e => e[0].indexOf('person.') === 0 && e[1].state === "home").length;
    return "People home: " + count;
  ]]]
subtitle: Support for templating!
```

# Conditional hiding
You can use a Javascript template to dynamically hide a card. This can be useful to create contextual cards (eg: only show when the front door is open, when there are lights on, ...).

To do so, write a Javascript template in the `hide_condition` attribute and return `true` if the card should be hidden.


**Example: Only show card when music is playing**
<div align="center">
    <img src="https://savjee.github.io/button-text-card/example-6.png">
</div>

```yaml
type: 'custom:button-text-card'
title: There is music playing
icon: 'mdi:music-circle'
hide_condition: |
  [[[
    const active_players = Object.entries(states).filter(e => e[0].indexOf('media_player.')===0 && e[1].state === 'playing');
    return active_players.length === 0;
  ]]]
```

Cool feature: when you go into edit mode, all hidden cards will appear with an opacity of 50%. That way you can easily manage all your cards.

<div align="center">
    <img src="https://savjee.github.io/button-text-card/example-6a.png">
</div>

**Example: Only show card when the front door is open**
<div align="center">
    <img src="https://savjee.github.io/button-text-card/example-7.png">
</div>

```
type: 'custom:button-text-card'
large: true
entity: binary_sensor.voordeur
title: Front door open!
background_color: '#A81419'
font_color: '#fff'
icon: 'mdi:door-open'
hide_condition: |
  [[[ return entity.state === "off" ]]]
```

# TODO
* Document tap_action support

# License & contributions
See [LICENSE](/LICENSE)

Feel free to suggest improvements, flag issues, open pull requests, ...
