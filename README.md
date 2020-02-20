<p align="center">
  <a href="" rel="noopener">
 <img src="docs/logo.png" alt="Project logo"></a>
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

# Install

1. Open HACS
2. Go to Settings > Custom Repository
3. Add `git@github.com:Savjee/button-text-card.git` as plugin
4. Install it
5. Add to your Lovelace config:

```yaml
  - url: /community_plugin/button-text-card/button-text-card.js
    type: module
```

# Examples

**Basic card with static title, subtitle and custom icon**
<div align="center">
    <img src="docs/example-1.png">
</div>

```yaml
type: 'custom:button-text-card'
title: Title
subtitle: Subtitle
icon: 'mdi:lightbulb-outline'
```

**Only title**
<div align="center">
    <img src="docs/example-2.png">
</div>

```yaml
type: 'custom:button-text-card'
title: Only title
icon: 'mdi:format-title'
```

**Support for templating**

You can use templates in title, subtitle and even for the icon: 
<div align="center">
    <img src="docs/example-3.png">
</div>

```yaml
type: 'custom:button-text-card'
icon: >
  {% if states.person | selectattr('state', 'eq', 'home') | count | int == 0 %} 
    mdi:home-export-outline 
  {% else %} 
    mdi:home-import-outline 
  {% endif %}
title: >
  People home: 
    {{ states.person | selectattr('state', 'eq', 'home') | list | count | int }}
subtitle: Support for templating!
```