import { QueryResultRow } from 'pg';

import db from '../config/db';
import { TrainedModel, ModelState } from '../lib/Modelling';

export interface Model {
    id: number;
    uuid: string;
    userId: number;
    dataSourceId: number;
    username: string;
    name: string;
    description: string;
    dataset: string;
    online: boolean;
    active: boolean;
    public: boolean;
    createdAt: number;
    model?: TrainedModel;
    state?: ModelState;
}

/**
 * Generate model object from data row.
 * @param row Data row.
 * @param metadata Indicates if only metadata should be included.
 * @returns Model object.
 */
function getModel(row: QueryResultRow, metadata = false): Model {
    const model = {
        id: row.id,
        uuid: row.uuid,
        userId: row.user_id,
        dataSourceId: row.datasource_id,
        username: row.username,
        name: row.name,
        description: row.description,
        dataset: row.dataset,
        online: row.online,
        active: row.active,
        public: row.public,
        createdAt: (row.created_at as Date).getTime(),
    };

    return metadata
        ? model
        : {
              ...model,
              model: row.model,
              state: row.state,
          };
}

export async function findById(id: number): Promise<Model | null> {
    const { rows } = await db.query(
        `
        SELECT models.*, users.email AS username FROM models
        LEFT JOIN users ON models.user_id = users.id
        WHERE models.id = $1;`,
        [id]
    );

    if (!rows.length) {
        return null;
    }

    return getModel(rows[0]);
}

export async function findByUuid(uuid: string): Promise<Model | null> {
    const { rows } = await db.query(
        `
        SELECT models.*, users.email AS username FROM models
        LEFT JOIN users ON models.user_id = users.id
        WHERE models.uuid = $1;`,
        [uuid]
    );

    if (!rows.length) {
        return null;
    }

    return getModel(rows[0]);
}

export async function findByDataSourceId(dataSourceId: number): Promise<Model[]> {
    const { rows } = await db.query(
        `
        SELECT * FROM models
        WHERE datasource_id = $1;`,
        [dataSourceId]
    );

    return rows.map((row) => getModel(row, true));
}

export async function get(
    userId: number,
    includePublic = false,
    includeSharedModels = false
): Promise<Model[]> {
    const publicConstraint = includePublic ? ' OR models.public = true' : '';
    const sharedConstraint = includeSharedModels
        ? ` OR models.id IN (SELECT model_id from user_model WHERE user_id = ${userId})`
        : '';
    const { rows } = await db.query(
        `
        SELECT models.*, users.email AS username FROM models
        LEFT JOIN users ON models.user_id = users.id
        WHERE models.user_id = $1${publicConstraint}${sharedConstraint};`,
        [userId]
    );

    return rows.map((row) => getModel(row, true));
}

export async function getActive(): Promise<Model[]> {
    const { rows } = await db.query(
        `
        SELECT * FROM models
        WHERE online = true AND active = true;`
    );

    return rows.map((row) => getModel(row, false));
}

export async function add(
    userId: number,
    dataSourceId: number,
    name: string,
    description: string,
    dataset: string,
    online: boolean,
    model: string
): Promise<number> {
    const { rowCount, rows } = await db.query(
        `
        INSERT INTO models(user_id, datasource_id, name, description, dataset, online, active, public, model)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        RETURNING id;`,
        [userId, dataSourceId || null, name, description, dataset, online, online, false, model]
    );
    return Number(rowCount) > 0 && rows[0].id;
}

export async function del(id: number): Promise<boolean> {
    const { rowCount } = await db.query(
        `
        DELETE FROM models
        WHERE id = $1;`,
        [id]
    );

    if (!rowCount) {
        return false;
    }

    return true;
}

export async function setPublic(id: number, value: boolean): Promise<boolean> {
    const { rowCount } = await db.query(
        `
        UPDATE models
        SET public = $1
        WHERE id = $2;`,
        [value, id]
    );

    if (!rowCount) {
        return false;
    }

    return true;
}

export async function setActive(id: number, value: boolean): Promise<boolean> {
    const { rowCount } = await db.query(
        `
        UPDATE models
        SET active = $1
        WHERE id = $2;`,
        [value, id]
    );

    if (!rowCount) {
        return false;
    }

    return true;
}

export async function updateDescription(id: number, value: string): Promise<boolean> {
    const { rowCount } = await db.query(
        `
        UPDATE models
        SET description = $1
        WHERE id = $2;`,
        [value, id]
    );

    if (!rowCount) {
        return false;
    }

    return true;
}

export async function updateModel(id: number, value: TrainedModel): Promise<boolean> {
    const { rowCount } = await db.query(
        `
        UPDATE models
        SET model = $1
        WHERE id = $2;`,
        [value, id]
    );

    if (!rowCount) {
        return false;
    }

    return true;
}

export async function updateState(id: number, value: ModelState): Promise<boolean> {
    const { rowCount } = await db.query(
        `
        UPDATE models
        SET state = $1
        WHERE id = $2;`,
        [value, id]
    );

    if (!rowCount) {
        return false;
    }

    return true;
}

export async function delUserModel(userId?: number, modelId?: number): Promise<number> {
    if (userId !== undefined && modelId !== undefined) {
        const { rowCount } = await db.query(
            `
            DELETE FROM user_model
            WHERE user_id = $1 AND model_id = $2;`,
            [userId, modelId]
        );

        return Number(rowCount);
    }

    if (userId !== undefined) {
        const { rowCount } = await db.query(
            `
            DELETE FROM user_model
            WHERE user_id = $1;`,
            [userId]
        );

        return Number(rowCount);
    }

    if (modelId !== undefined) {
        const { rowCount } = await db.query(
            `
            DELETE FROM user_model
            WHERE model_id = $1;`,
            [modelId]
        );

        return Number(rowCount);
    }

    return 0;
}

export async function addModelUsers(modelId: number, userIds: number[]): Promise<number> {
    const values = userIds.map((userId) => `(${userId},${modelId})`).join(',');
    const { rowCount } = await db.query(
        `
        INSERT INTO user_model (user_id, model_id)
        VALUES ${values};`
    );

    return Number(rowCount);
}

export async function getModelUsers(modelId: number): Promise<number[]> {
    const { rows } = await db.query(
        `
            SELECT user_id from user_model
            WHERE model_id = $1`,
        [modelId]
    );

    return rows.map((row) => row.user_id);
}
