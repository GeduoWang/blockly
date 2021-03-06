/**
 * Visual Blocks Editor
 *
 * Copyright 2012 Google Inc.
 * http://blockly.googlecode.com/
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

/**
 * @fileoverview Object representing an input (value, statement, or dummy).
 * @author fraser@google.com (Neil Fraser)
 */
'use strict';

goog.provide('Blockly.Input');

// TODO(scr): Fix circular dependencies
// goog.require('Blockly.Block');
goog.require('Blockly.Connection');
goog.require('Blockly.FieldLabel');


/**
 * Class for an input with an optional title.
 * @param {number} type The type of the input.
 * @param {string} name Language-neutral identifier which may used to find this
 *     input again.
 * @param {!Blockly.Block} block The block containing this input.
 * @param {?Blockly.Connection} connection Optional connection for this input.
 * @param {?number} statementTrailingSpace Optional extra space to render below
 *     this input.
 * @constructor
 */
Blockly.Input = function(type, name, block, connection, statementTrailingSpace) {
  this.type = type;
  this.name = name;
  this.sourceBlock_ = block;
  this.connection = connection;
  this.titleRow = [];
  this.align = Blockly.ALIGN_LEFT;
  this.inline_ = false;
  this.visible_ = true;
  this.colour_ = {
    hue: null,
    saturation: null,
    value: null
  };
  /**
   * Extra space to leave trailing the last block in a statement input.
   * @private {number}
   */
  this.statementTrailingSpace_ = statementTrailingSpace || 0;
};

/**
 * Add an item to the end of the input's title row.
 * @param {*} title Something to add as a title.
 * @param {?string} opt_name Language-neutral identifier which may used to find
 *     this title again.  Should be unique to the host block.
 * @return {!Blockly.Input} The input being append to (to allow chaining).
 */
Blockly.Input.prototype.appendTitle = function(title, opt_name) {
  // Empty string, Null or undefined generates no title, unless title is named.
  if (!title && !opt_name) {
    return this;
  }
  // Generate a FieldLabel when given a plain text title.
  if (goog.isString(title)) {
    title = new Blockly.FieldLabel(/** @type {string} */ (title));
  }
  if (this.sourceBlock_.svg_) {
    title.init(this.sourceBlock_);
  }
  title.name = opt_name;

  if (title.prefixTitle) {
    // Add any prefix.
    this.appendTitle(title.prefixTitle);
  }
  // Add the title to the title row.
  this.titleRow.push(title);
  if (title.suffixTitle) {
    // Add any suffix.
    this.appendTitle(title.suffixTitle);
  }

  if (this.sourceBlock_.rendered) {
    this.sourceBlock_.render();
    // Adding a title will cause the block to change shape.
    this.sourceBlock_.bumpNeighbours();
  }
  return this;
};

/**
 * Gets whether this input is visible or not.
 * @return {boolean} True if visible.
 */
Blockly.Input.prototype.isVisible = function() {
  return this.visible_;
};

/**
 * Sets whether this input is visible or not.
 * @param {boolean} visible True if visible.
 * @return {!Array.<!Blockly.Block>} List of blocks to render.
 */
Blockly.Input.prototype.setVisible = function(visible) {
  var renderList = [];
  if (this.visible_ == visible) {
    return renderList;
  }
  this.visible_ = visible;

  var display = visible ? 'block' : 'none';
  for (var y = 0, title; title = this.titleRow[y]; y++) {
    title.setVisible(visible);
  }
  if (this.connection) {
    // Has a connection.
    if (visible) {
      renderList = this.connection.unhideAll();
    } else {
      renderList = this.connection.hideAll();
    }
    var child = this.connection.targetBlock();
    if (child) {
      child.svg_.getRootElement().style.display = display;
      if (!visible) {
        child.rendered = false;
      }
    }
  }
  return renderList;
};

/**
 * Change a connection's compatibility.
 * @param {string|Array.<string>|null} check Compatible value type or
 *     list of value types.  Null if all types are compatible.
 * @return {!Blockly.Input} The input being modified (to allow chaining).
 */
Blockly.Input.prototype.setStrictCheck = function(check) {
  if (!this.connection) {
    throw 'This input does not have a connection.';
  }
  this.connection.setStrictCheck(check);
  return this;
};

/**
 * Change a connection's compatibility.
 * @param {string|Array.<string>|null} check Compatible value type or
 *     list of value types.  Null if all types are compatible.
 * @return {!Blockly.Input} The input being modified (to allow chaining).
 */
Blockly.Input.prototype.setCheck = function(check) {
  if (!this.connection) {
    throw 'This input does not have a connection.';
  }
  this.connection.setCheck(check);
  return this;
};

/**
 * Enable the specified field helper with the specified options for this
 * input's connection
 * @param {string} fieldHelper the field helper to retrieve. One of
 *        Blockly.BlockFieldHelper
 * @param {*} options for this helper
 * @return {!Blockly.Input} The input being modified (to allow chaining).
 */
Blockly.Input.prototype.addFieldHelper = function(fieldHelper, options) {
  if (this.type !== Blockly.INPUT_VALUE) {
    throw 'Only Value Inputs can be augmented with helpers';
  }

  this.connection.addFieldHelper(fieldHelper, options);
  return this;
};

/**
 * Change the alignment of the connection's title(s).
 * @param {number} align One of Blockly.ALIGN_LEFT, ALIGN_CENTRE, ALIGN_RIGHT.
 *   In RTL mode directions are reversed, and ALIGN_RIGHT aligns to the left.
 * @return {!Blockly.Input} The input being modified (to allow chaining).
 */
Blockly.Input.prototype.setAlign = function(align) {
  this.align = align;
  if (this.sourceBlock_.rendered) {
    this.sourceBlock_.render();
  }
  return this;
};

/**
 * Initialize the titles on this input.
 */
Blockly.Input.prototype.init = function() {
  for (var x = 0; x < this.titleRow.length; x++) {
    this.titleRow[x].init(this.sourceBlock_);
  }
};

/**
 * Sever all links to this input.
 */
Blockly.Input.prototype.dispose = function() {
  for (var i = 0, title; title = this.titleRow[i]; i++) {
    title.dispose();
  }
  if (this.connection) {
    this.connection.dispose();
  }
  this.sourceBlock_ = null;
};

/**
 * Mark this input as being inlined (on the same row as the previous input).
 * When rendering blocks, each input will get a new line unless
 * (1) inputsInLine is true on the parent block
 * (2) inline_ is set on the input
 * Note, we don't allow inlining NEXT_STATEMENT inputs
 */
Blockly.Input.prototype.setInline = function (inline) {
  if (inline === undefined) {
    inline = true;
  }
  this.inline_ = inline;
  if (this.type === Blockly.NEXT_STATEMENT && inline) {
    throw "Can't inline next statement";
  }
  return this;
};

/**
 * Is this input inlined? Can be marked on the input itself, or on the source
 * block
 */
Blockly.Input.prototype.isInline = function () {
  if (this.type === Blockly.NEXT_STATEMENT) {
    return false;
  }
  return this.inline_ || this.sourceBlock_.inputsInline;
};

Blockly.Input.prototype.setHSV = function (hue, saturation, value) {
  if (this.type !== Blockly.FUNCTIONAL_INPUT) {
    throw "setColor only for functional inputs";
  }
  this.colour_ = { hue: hue, saturation: saturation, value: value };

  return this;
};

Blockly.Input.prototype.getHexColour = function() {
  return Blockly.makeColour(this.colour_.hue, this.colour_.saturation,
    this.colour_.value);
};

/**
 * @return {number} extra spacing to leave below last statement in an input.
 */
Blockly.Input.prototype.getStatementTrailingSpace = function() {
  return this.statementTrailingSpace_;
};

Blockly.Input.prototype.matchesBlock = function (block) {
  if (block.getColour() !== this.colour_.hue) {
    return false;
  }
  if (block.getSaturation() !== this.colour_.saturation) {
    return false;
  }
  if (block.getValue() !== this.colour_.value) {
    return false;
  }
  return true;
};
