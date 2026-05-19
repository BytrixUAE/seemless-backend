'use strict'

const { first } = require("@adonisjs/lucid/src/Lucid/Model");
const RestModel = use('./RestModel');
const _ = use('lodash');

class SampleModel extends RestModel {

  table() {
    return "table name";
  }

  /**
   * The field name used to set the creation timestamp (return null to disable):
   */
  createdAtColumn() {
    return 'created_at';
  }

  /**
   * The field name used to set the creation timestamp (return null to disable):
   */
  updatedAtColumn() {
    return 'updated_at';
  }

  softdelete() {
    return true;
  }

  /**
   * The attributes that are mass assignable.
   *
   * @var array
   */
  getFields() {
    return [];
  }


  /**
   * mention column for select query
   */
  showColumns() {
    return [];
  }

  /**
   * omit fields from update request
   */
  exceptUpdateField() {
    return [];
  }

  /**
   * Hook for manipulate query of index result
   * @param {current mongo query} query
   * @param {adonis request object} request
   * @param {object} slug
   */
  async indexQueryHook(query, request, slug = {}) {

  }

  /**
   * Hook for manipulate data input before add data is execute
   * @param {adonis request object} request
   * @param {payload object} params
   */
  async beforeCreateHook(request, params) {

  }

  /**
   * Hook for execute command after add public static function called
   * @param {saved record object} record
   * @param {adonis request object} request
   * @param {payload object} params
   */
  async afterCreateHook(record, request, params) {

  }

  /**
   * Hook for manipulate data input before update data is execute
   * @param {adonis request object} request
   * @param {payload object} params
   * @param {string} slug
   */
  async beforeEditHook(request, params, slug) {
    // let exceptUpdateField = this.exceptUpdateField();
    // exceptUpdateField.filter(exceptField => {
    //     delete params[exceptField];
    // });
  }

  /**
   * Hook for execute command after edit
   * @param {updated record object} record
   * @param {adonis request object} request
   * @param {payload object} params
   */
  async afterEditHook(record, request, params) {

  }

  /**
   * Hook for execute command before delete
   * @param {adonis request object} request
   * @param {payload object} params
   * @param {string} slug
   */
  async beforeDeleteHook(request, params, slug) {

  }

  /**
   * Hook for execute command after delete
   * @param {adonis request object} request
   * @param {payload object} params
   * @param {string} slug
   */
  async afterDeleteHook(request, params, slug) {

  }

  /**
   * Hook for manipulate query of datatable result
   * @param {current mongo query} query
   * @param {adonis request object} request
   */
  async datatable_query_hook(query, request) {

  }
}
module.exports = SampleModel
