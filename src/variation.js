import { VariationProcessor } from './variationprocessor.js';

export class VariationManager {
    constructor(font) {
        this.font = font;
        this.process = new VariationProcessor(this.font);
        this.activateDefaultVariation();
        this.getTransform = this.process.getTransform.bind(this.process);
        this.getTransformPath = this.process.getTransformPath.bind(this.process);
        this.getTransformGlyph = this.process.getTransformGlyph.bind(this.process);
        this.getTransformCommands = this.process.getTransformCommands.bind(this.process);
    }

    /**
     * Tries to determine the default instance and sets its variation data as the font.defaultRenderOptions.
     * If not defaultInstance can be determined, the default coordinates of all axes are used.
     */
    activateDefaultVariation() {
        const defaultInstance = this.getDefaultInstanceIndex();
        if (defaultInstance > -1) {
            this.set(defaultInstance);
        } else {
            this.set(this.getDefaultCoordinates());
        }
    }

    /**
     * Returns the coordinates made up of all the axes' default values
     * @returns {Object}
     */
    getDefaultCoordinates() {
        return this.fvar().axes.reduce((acc, axis) => {
            acc[axis.tag] = axis.defaultValue;
            return acc;
        }, {});
    }

    /**
     * Gets the index of the default variation instance or -1 if not able to determine
     * @returns {integer}
     */
    getDefaultInstanceIndex() {
        const defaultCoordinates = this.getDefaultCoordinates();
        
        let defaultInstanceIndex = this.getInstanceIndex(defaultCoordinates);
        
        if (defaultInstanceIndex < 0) {
            defaultInstanceIndex = this.fvar().instances.findIndex(instance => instance.name && instance.name.en === 'Regular');
        }

        return defaultInstanceIndex;
    }

    /**
     * Gets the index of the variation instance matching the coordinates object or -1 if not able to determine
     * @param {integer|Object} coordinates An object with axis tags as keys and variation values as values} index 
     * @returns {integer}
     */
    getInstanceIndex(coordinates) {
        return this.fvar().instances.findIndex(instance =>
            Object.keys(coordinates).every(axis =>
                instance.coordinates[axis] === coordinates[axis]
            )
        );
    }

    /**
     * Gets a variation instance by its zero-based index
     * @param {integer} index 
     * @returns {Object}
     */
    getInstance(index) {
        return this.fvar().instances && this.fvar().instances[index];
    }

    /**
     * Set the variation coordinates to use by default for rendering in the font.defaultRenderOptions
     * @param {integer|Object} instanceIdOrObject Either the zero-based index of a variation instance or an object with axis tags as keys and variation values as values
     */
    set(instanceIdOrObject) {
        let variationData;
        if(Number.isInteger(instanceIdOrObject)) {
            const instance = this.getInstance(instanceIdOrObject);
            if (!instance) {
                throw Error(`Invalid instance index ${instanceIdOrObject}`);
            }
            variationData = {...instance.coordinates};
        } else {
            variationData = instanceIdOrObject;
        }
        this.font.defaultRenderOptions = Object.assign({}, this.font.defaultRenderOptions, {variation: variationData});
    }

    /**
     * Returns the variation coordinates currently set in the font.defaultRenderOptions
     * @returns {Object}
     */
    get() {
        return Object.assign({}, this.font.defaultRenderOptions.variation);
    }

    /**
     * Helper method that returns the font's avar table if present
     * @returns {Object|undefined}
     */
    avar() {
        return this.font.tables.avar;
    }

    /**
     * Helper method that returns the font's cvar table if present
     * @returns {Object|undefined}
     */
    cvar() {
        return this.font.tables.cvar;
    }

    /**
     * Helper method that returns the font's fvar table if present
     * @returns {Object|undefined}
     */
    fvar() {
        return this.font.tables.fvar;
    }

    /**
     * Helper method that returns the font's gvar table if present
     * @returns {Object|undefined}
     */
    gvar() {
        return this.font.tables.gvar;
    }

    /**
     * Helper method that returns the font's hvar table if present
     * @returns {Object|undefined}
     */
    hvar() {
        return this.font.tables.hvar;
    }
}