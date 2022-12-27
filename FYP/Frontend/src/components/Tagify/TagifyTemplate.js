function tagTemplate(tagData) {
  return `
    <tag title="${tagData.email}"
      contenteditable='false'
      spellcheck='false'
      tabIndex="-1"
      class="tagify__tag ${tagData.class ? tagData.class : ""}"
      ${this.getAttributes(tagData)}>

      <x title='' class='tagify__tag__removeBtn' role='button' aria-label='remove tag'></x>

      <div>
        <span class='tagify__tag-text'>${tagData.name}</span>
      </div>

    </tag>
        `
}

function suggestionItemTemplate(tagData) {
  return `
    <div ${this.getAttributes(tagData)}
      class='tagify__dropdown__item ${tagData.class ? tagData.class : ""}'
      tabindex="0"
      role="option">
      <strong>${tagData.name}</strong>
      <span>${tagData.email}</span>
    </div>
        `
}

function dropdownHeaderTemplate(suggestions) {
  return `
    <div class="${this.settings.classNames.dropdownItem} ${this.settings.classNames.dropdownItem}__addAll">
      <strong>${this.value.length ? `Add Remaining ${suggestions.length}` : 'Add All'}</strong>
      <span>${suggestions.length} members</span>
    </div>
        `
}

export { tagTemplate, suggestionItemTemplate, dropdownHeaderTemplate }