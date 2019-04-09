/**
 * Module dependencies
 */
const _ = require('@sailshq/lodash');
const actionUtil = require('sails/lib/hooks/blueprints/actionUtil');

/**
 * Find Records
 *
 * http://sailsjs.com/docs/reference/blueprint-api/find
 *
 * An API call to find and return model instances from the data adapter
 * using the specified criteria.  If an id was specified, just the instance
 * with that unique id will be returned.
 *
 */

module.exports = async function findRecords(req, res) {

    const parseBlueprintOptions = req._sails.config.blueprints.parseBlueprintOptions;

    // Set the blueprint action for parseBlueprintOptions.
    req.options.blueprintAction = 'find';

    const queryOptions = parseBlueprintOptions(req);
    const Model = req._sails.models[queryOptions.using];

    /**
     * Pages
     */
    let page = 1;
    if (!_.isUndefined(queryOptions.criteria.where.page)) {
        page = parseInt(queryOptions.criteria.where.page);
        queryOptions.criteria.where = _.omit(queryOptions.criteria.where, 'page');
    }
    page = page > 1 ? (page - 1) : 0;
    queryOptions.criteria.skip = queryOptions.criteria.limit * page;

    /**
     * Filters
     */
    let where = queryOptions.criteria.where;
    let collections = _.keys(where).map((i, a) => {
        let fields = i.split('.');

        if (_.isUndefined(Model.attributes[fields[0]])) {
            return;
        }
        model = Model.attributes[fields[0]]['collection'];
        if (model) {
            queryOptions.criteria.where = _.omit(queryOptions.criteria.where, i);
            return {
                model,
                field: fields[1] ? fields[1] : 'id',
                where: where[i]
            }
        }
    }).filter(i => i);

    try {

        if (collections[0]) {
            let globalFilter = [];
            for (let collection of collections) {

                let localFilter = [];
                let modelConnect = req._sails.models[collection.model];
                let populateName = modelConnect.associations[0]['alias'];

                let query = {};
                query[collection.field] = collection.where;

                let getItems = await modelConnect.find(query).populate(populateName);
                getItems.forEach(i => i[populateName].forEach(item => localFilter.push(item.id)));
                globalFilter.push(localFilter);
            }

            globalFilter = _.intersection(...globalFilter);
            queryOptions.criteria.where['id'] = {
                'in': globalFilter
            };
        }

        const count = await Model.count(queryOptions.criteria.where);
        const matchingRecords = await Model
            .find(queryOptions.criteria, queryOptions.populates)
            .meta(queryOptions.meta);


        if (req._sails.hooks.pubsub && req.isSocket) {
            Model.subscribe(req, _.pluck(matchingRecords, Model.primaryKey));
            // Only `._watch()` for new instances of the model if
            // `autoWatch` is enabled.
            if (req.options.autoWatch) {
                Model._watch(req);
            }
            // Also subscribe to instances of all associated models
            _.each(matchingRecords, (record) => {
                actionUtil.subscribeDeep(req, record);
            });
        }

        res.ok({
            data: matchingRecords,
            meta: {
                total: count,
                limit: queryOptions.criteria.limit,
                skip: queryOptions.criteria.skip,
                totalPages: Math.ceil(count / queryOptions.criteria.limit),
                criteria: queryOptions.criteria.where,
                sort: queryOptions.criteria.sort
            }
        });

    } catch (err) {

        if (err) {
            // If this is a usage error coming back from Waterline,
            // (e.g. a bad criteria), then respond w/ a 400 status code.
            // Otherwise, it's something unexpected, so use 500.
            switch (err.name) {
                case 'UsageError':
                    return res.badRequest(err);
                default:
                    return res.serverError(err);
            }
        }

    }

};
