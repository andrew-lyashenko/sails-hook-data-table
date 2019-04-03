/**
 * data-table hook
 *
 * @description :: A hook definition.  Extends Sails by adding shadow routes, implicit actions, and/or initialization logic.
 * @docs        :: https://sailsjs.com/docs/concepts/extending-sails/hooks
 */
const pluralize = require('pluralize');
const util = require('util');
const BlueprintController = {
    dataTable: require('./blueprints/dataTable')
};

module.exports = function defineDataTableHook(sails) {

    return {

        /**
         * Runs when a Sails app loads/lifts.
         *
         * @param {Function} done
         */
        initialize: function (done) {

            let config = sails.config.blueprints;
            if (sails.hooks.orm) {
                sails.after('hook:orm:loaded', () => {
                    this.registerActions();
                });
            }

            if (config.rest) {
                sails.on('router:before', () => {
                    _.each(sails.models, (Model, identity) => {

                        if (_.some(config._controllers, (config, controllerIdentity) => {
                            return config.rest === false && identity === controllerIdentity;
                        }) || !Model.dataTable) {
                            return;
                        }

                        const baseRestRoute = (() => {
                            let baseRouteName = identity;
                            if (config.pluralize) {
                                baseRouteName = pluralize(baseRouteName);
                            }
                            return config.prefix + config.restPrefix + '/' + baseRouteName;
                        })();

                        _bindRestRoute('get %s/data-table', 'dataTable');

                        function _bindRestRoute(template, blueprintActionName) {
                            // Get the URL for the RESTful route
                            const restRoute = util.format(template, baseRestRoute);
                            // Bind it to the appropriate action, adding in some route options including a deep clone of the model associations.
                            // The clone prevents the blueprint action from accidentally altering the model definition in any way.
                            sails.router.bind(
                                restRoute,
                                identity + '/' + blueprintActionName,
                                null,
                                {
                                    model: identity,
                                    associations: _.cloneDeep(Model.associations),
                                    autoWatch: sails.config.blueprints.autoWatch
                                }
                            );
                        }

                    });
                });
            }

            return done();
        },

        registerActions() {
            _.each(sails.models, (model, modelIdentity) => {
                if (model.dataTable === true) {
                    sails.registerAction(BlueprintController.dataTable, modelIdentity + '/dataTable');
                }
            });
        }

    };

};
