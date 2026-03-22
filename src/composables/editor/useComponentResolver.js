import { getComponentLayoutClasses } from "@/utils/componentLayouts";
import { getDefaultComponentType } from "@/composables/useDefaultComponentType";

/**
 * Composable for resolving component props and classes
 * Handles component type detection, props extraction, and grid class generation
 */
export function useComponentResolver(componentMap) {
  /**
   * Get the component to render for an entity
   */
  const getComponentForEntity = (entity) => {
    if (!entity) return null;

    // Special mapping for HaEntityList to EntityList component
    if (entity.type === "HaEntityList") {
      return componentMap.EntityList;
    }

    // If entity has explicit type, use it
    if (entity.type && componentMap[entity.type]) {
      return componentMap[entity.type];
    }

    // Special cases for non-entity items (when no entity ID is present)
    if (!entity.entity && !entity.getter) {
      if (entity.type === "HaRowSpacer" || entity.type === "HaSpacer") {
        return componentMap.HaSpacer;
      }
      if (entity.type === "HaHeader") {
        return componentMap.HaHeader;
      }
      if (entity.type === "HaLink") {
        return componentMap.HaLink;
      }
    }

    // If no explicit type, use getDefaultComponentType for auto-detection
    if (!entity.type) {
      const defaultType = getDefaultComponentType(
        entity.entity || entity.getter,
        entity.getter,
      );
      if (defaultType && componentMap[defaultType]) {
        return componentMap[defaultType];
      }
    }

    // Default fallback
    return componentMap.HaSensor;
  };

  /**
   * Get the entity data to pass to component
   * Pass just the entity ID(s) so components can resolve their own data
   */
  const getEntityDataForComponent = (entity) => {
    if (!entity) return null;

    // For HaEntityList, don't pass entity data - it uses entities/getter instead
    if (entity.type === "HaEntityList") {
      return null;
    }

    // If entity has an array of entity IDs (like HaRoom, HaGlance)
    if (entity.entity && Array.isArray(entity.entity)) {
      return entity.entity;
    }

    // If entity has a single entity ID string
    if (entity.entity && typeof entity.entity === "string") {
      return entity.entity;
    }

    // Fallback: check for entities property (alternative naming)
    if (entity.entities && Array.isArray(entity.entities)) {
      return entity.entities;
    }

    // For non-entity types (spacer, header, link, image), pass the full config
    if (
      entity.type &&
      ["HaRowSpacer", "HaSpacer", "HaHeader", "HaLink", "HaImage"].includes(
        entity.type,
      )
    ) {
      return entity;
    }

    // Safety fallback: if we have no valid entity data, return empty string to prevent errors
    return "";
  };

  /**
   * Get custom properties from entity config
   * Filters out standard config properties (entity, type, layout, getter, etc.)
   */
  const getComponentCustomProps = (entity) => {
    if (!entity) return {};

    // Special handling for HaEntityList - construct entities array for the component
    if (entity.type === "HaEntityList") {
      const entitiesForList = entity.entities || [];
      if (entity.getter && !entitiesForList.length) {
        entitiesForList.push({ getter: entity.getter });
      }
      return {
        entities: entitiesForList,
        componentMap: entity.componentMap || {},
        attributes: entity.attributes || [],
      };
    }

    // List of standard config properties that shouldn't be passed as component props
    const standardProps = ["entity", "entities", "type", "getter", "layout"];

    // Extract custom properties (like color, operator, message, etc.)
    const customProps = {};
    for (const [key, value] of Object.entries(entity)) {
      if (!standardProps.includes(key) && value !== undefined && value !== null) {
        customProps[key] = value;
      }
    }

    return customProps;
  };

  /**
   * Combine entity data and custom props for a component
   * Different components need different prop structures
   */
  const getComponentProps = (entity) => {
    if (!entity) return {};

    const props = {};

    // For HaImage, HaLink, HaHeader, HaSpacer - only use custom props (url, title, etc.)
    // Don't pass entity prop since these components don't use it
    if (
      ["HaImage", "HaLink", "HaHeader", "HaSpacer", "HaRowSpacer"].includes(
        entity.type,
      )
    ) {
      return getComponentCustomProps(entity);
    }

    // For other components, include both entity data and custom props
    const entityData = getEntityDataForComponent(entity);
    if (entityData) {
      props.entity = entityData;
    }

    // Merge in custom props
    Object.assign(props, getComponentCustomProps(entity));

    return props;
  };

  /**
   * Get Bootstrap grid classes for a component
   * Uses componentLayouts.js for consistent sizing across editor and views
   */
  const getComponentClasses = (entity) => {
    if (!entity) return "col-lg-4 col-md-6";
    return getComponentLayoutClasses(entity.type);
  };

  return {
    getComponentForEntity,
    getEntityDataForComponent,
    getComponentCustomProps,
    getComponentProps,
    getComponentClasses,
  };
}
