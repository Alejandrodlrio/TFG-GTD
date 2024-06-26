const db = require('../bd/pool.js')
const tagService = require('./tagService.js')

const taskService = {}

//Common queries
const querySearchByID = "SELECT * FROM tasks WHERE task_id = $1"
const querySearchByListIDS = "SELECT * FROM tasks WHERE task_id = ANY($1) and user_id = $2"


taskService.createTask = async (task_data) => {
    const task = completeTaskDefValues(task_data)

    if (task.user_id && task.title && task.title.length !== 0) {
        let res = await db.query("INSERT INTO tasks(user_id, context_id, project_id, title, description, state, completed, verification_list, important_fixed, date_added, date_completed, date_limit, date_changed, num_version) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14) RETURNING task_id",
            [task.user_id, task.context_id, task.project_id, task.title, task.description, task.state, task.completed, task.verification_list, task.important_fixed, task.date_added, task.date_completed, task.date_limit, task.date_changed, task.num_version]);

        return res.rowCount === 1 ? res.rows[0].task_id : -1;
    } else {
        throw new Error("Tienen que estar rellenos los campos indicados");
    }
}

taskService.modifyTask = async (task_id, task) => {
    const conn = await db.getClient();

    let res = await conn.query(querySearchByID, [task_id]);

    if (res.rows.length !== 1) {
        throw new Error('The task does not exist');
    }
    task = updateTaskDefValues(res.rows[0], task);

    if (task.user_id !== 0) {
        let res = await conn.query("UPDATE tasks SET user_id = $1, context_id = $2, project_id = $3, title = $4, description = $5, state = $6, verification_list = $7, important_fixed = $8, date_added = $9, date_completed = $10, date_limit = $11, date_changed = $12, num_version = $13, completed = $14 WHERE task_id = $15 RETURNING task_id",
            [task.user_id, task.context_id, task.project_id, task.title, task.description, task.state, task.verification_list, task.important_fixed, task.date_added, task.date_completed, task.date_limit, task.date_changed, task.num_version, task.completed, task_id]);
        if (res.rowCount !== 1) {
            throw new Error('The task does not exist');
        } else {
            conn.release();
            return res.rowCount === 1 ? res.rows[0].task_id : -1;
        }
    } else {
        throw new Error("Tienen que estar rellenos los campos indicados");
    }

}

taskService.findTaskById = async (id, user_id) => {
    const res = await db.query('SELECT t.* , p.color as project_color, p.title as project_title, c.name as context_name, t2.tags, t2.tagcolors ' +
        'FROM tasks t LEFT JOIN projects p on t.project_id = p.project_id ' +
        'left join (SELECT task_id, string_agg(nametag::text, \'\,\'\) as tags, string_agg(tg.colour::text, \'\,\'\) as tagcolors FROM tagstotask tot ' +
        'join tags tg on tot.nametag = tg.name ' +
        'group by task_id ) t2 on t.task_id = t2.task_id ' +
        'LEFT JOIN areas_contexts c on t.context_id = c.context_id WHERE t.task_id = $1 AND t.user_id = $2 ', [id, user_id])

    if (res.rows.length !== 1) {
        throw new Error('The task does not exist');
    } else {
        //Parse tags to list of tags
        res.rows.map((row) => {
            const tags = row.tags === null ? [] : row.tags.split(",");
            const tagsColors = row.tagcolors === null ? [] : row.tagcolors.split(",")
            const fullTags = tags.map((t, index) => {
                return { name: t, color: tagsColors[index] };
            })

            row.tags = fullTags;
            delete row.tagcolors
            return row;
        })
    }

    return res.rows[0];
}

taskService.findTasksByFilters = async (user_id, filters) => {
    const filterdQuery = addFiltersToQuery('SELECT t.* , p.color as project_color, p.title as project_title, c.name as context_name, t2.tags, t2.tagcolors ' +
        'FROM tasks t LEFT JOIN Projects p on t.project_id = p.project_id ' +
        'left join (SELECT task_id, string_agg(nametag::text, \'\,\'\) as tags, string_agg(tg.colour::text, \'\,\'\) as tagcolors FROM tagstotask tot ' +
        'join tags tg on tot.nametag = tg.name ' +
        'group by task_id ) t2 on t.task_id = t2.task_id ' +
        'LEFT JOIN areas_contexts c on t.context_id = c.context_id WHERE t.user_id = $1', filters);

    filterdQuery.values.unshift(user_id);

    const res = await db.query(filterdQuery.query, filterdQuery.values)

    //Parse tags to list of tags
    res.rows.map((row) => {
        const tags = row.tags === null ? [] : row.tags.split(",");
        const tagsColors = row.tagcolors === null ? [] : row.tagcolors.split(",")
        const fullTags = tags.map((t, index) => {
            return { name: t, color: tagsColors[index] };
        })

        row.tags = fullTags;
        delete row.tagcolors
        return row;
    })

    return res.rows;
}

taskService.findTaskByUserId = async (id) => {
    const res = await db.query('SELECT t.* , p.color as project_color, p.title as project_title, c.name as context_name, t2.tags, t2.tagcolors ' +
        'FROM tasks t LEFT JOIN projects p on t.project_id = p.project_id ' +
        'left join (SELECT task_id, string_agg(nametag::text, \'\,\'\) as tags, string_agg(tg.colour::text, \'\,\'\) as tagcolors FROM tagstotask tot ' +
        'join tags tg on tot.nametag = tg.name ' +
        'group by task_id ) t2 on t.task_id = t2.task_id ' +
        'LEFT JOIN areas_contexts c on t.context_id = c.context_id WHERE t.user_id = $1 AND t.completed is not true', [id])

    //Parse tags to list of tags
    res.rows.map((row) => {
        const tags = row.tags === null ? [] : row.tags.split(",");
        const tagsColors = row.tagcolors === null ? [] : row.tagcolors.split(",")
        const fullTags = tags.map((t, index) => {
            return { name: t, color: tagsColors[index] };
        })

        row.tags = fullTags;
        delete row.tagcolors
        return row;
    })

    return res.rows;
}

taskService.addTag = async (id, tag) => {
    const task = await db.query(querySearchByID, [id])

    if (task.rows.length !== 1) {
        throw new Error('The task does not exist')
    }
    else {
        const t = await tagService.findTag(tag.name);
        if (!t) {
            const c = await tagService.createTag(tag);
        }
        const intermediate = await db.query('SELECT * FROM TagsToTask WHERE task_id = $1 AND nameTag = $2', [id, tag.name])
        if (intermediate.rows.length !== 1) {
            const res = await db.query('INSERT INTO TagsToTask (task_id, nameTag) VALUES ($1,$2)', [id, tag.name])
            return true;
        }
        else {
            throw new Error('The tag was relationate to the task')
        }
    }

}

taskService.findTags = async (id) => {
    console.log(id)
    const tags = await db.query('SELECT tt.nametag AS name, t.colour AS color FROM TagsToTask as tt JOIN Tags as t on tt.nametag = t.name WHERE tt.task_id = $1', [id])
    console.log("ROWS: ", tags.rows)

    if (tags.rows.length < 1) {
        return false;
    }
    else {
        console.log("ROWS: ", tags.rows)
        return tags.rows;
    }
}

taskService.moveList = async (user_id, list_ids, state) => {
    const conn = await db.getClient();
    let res = await conn.query(querySearchByListIDS, [list_ids, user_id]);

    if (res.rows.length !== list_ids.length) {
        conn.release();
        throw new Error('Unexpected Error')
    }
    let setStatement = "SET state = $1";

    if (res.rows.length > 0 && res.rows[0].state === '3') {
        setStatement = setStatement.concat(", date_limit = null ");
    }

    if (state === '3') {
        setStatement = setStatement.concat(", date_limit = current_date");
    }

    const query = "UPDATE tasks " + setStatement + " WHERE task_id = ANY($2) and user_id = $3"

    res = await conn.query(query, [state, list_ids, user_id]);
    conn.release();

    return { moved: res.rowCount };
}


taskService.completeList = async (user_id, list_ids, completed) => {
    const conn = await db.getClient();
    let res = await conn.query(querySearchByListIDS, [list_ids, user_id]);
    console.log(completed)
    if (res.rows.length !== list_ids.length) {
        conn.release();
        throw new Error('Unexpected Error')
    }
    let setStatement = "SET completed = $1 , date_completed = current_date";

    const query = "UPDATE tasks " + setStatement + " WHERE task_id = ANY($2) and user_id = $3"

    res = await conn.query(query, [completed, list_ids, user_id]);
    conn.release();

    return { completed: res.rowCount };
}


// Obtenemos los datos de la sesion del usuario y las tareas asociadas segun el action.
taskService.getInfo = async (user_id, state) => {
    const res = await db.query('SELECT count (*) as total FROM tasks where user_id = $1 and state = $2 and completed is false group by important_fixed', [user_id, state])
    return res.rows;
}

taskService.newgetInfo = async (user_id, state) => {
    const res = await db.query('SELECT count (*) as total, state , important_fixed FROM tasks  where user_id = $1 and completed is false  group by important_fixed, state order by state, important_fixed', [user_id])

    let info = {
        1: { total: 0, important: 0 },
        2: { total: 0, important: 0 },
        3: { total: 0, important: 0 },
        4: { total: 0, important: 0 },
    }
    res.rows.forEach(e => {
        if (e.state != null && e.state < 5) {
            e.important_fixed ? info[e.state].important = parseInt(e.total) : info[e.state].total = parseInt(e.total);
        }
    })

    return info;
}

//Ofline Mode Syncronize
taskService.synchronizeOffline = async (task_list, user_id) => {
    const task_ids = []
    const remainingTasks = [];

    for(let index = 0; index < task_list.length; index++){
        const task = task_list[index]
        if (task.task_id && task.task_id > 0) {
            task_ids.push(task.task_id);
            remainingTasks.push(task);
        } else {
            //Se crea
            task.user_id = user_id;
            await taskService.createTask(task);
        }
    }

    const res = await db.query("SELECT * FROM tasks WHERE task_id = ANY($1) AND user_id = $2 ", [task_ids, user_id])

    const returnedTask = res.rows;
    const taskMap = {}

    for(let oldTask of returnedTask){
        taskMap[oldTask.task_id] = oldTask;
    }

    for(let task of remainingTasks){
        const oldTask = taskMap[task.task_id];
        
        if (oldTask && oldTask.num_version === task.num_version) {
            //AQUI SE UPDATEA TAL CUAL
            const updatedTask = updateTaskDefValues(oldTask, task);
            const returnedId = await updateOnly(updatedTask, oldTask.task_id);
    
            if(returnedId === -1){
                throw new Error('Synchronizing Error');
            }
        }
    }
    
    return {TotalSync: task_list.length};
}

async function updateOnly(task, task_id) {
    let res = await db.query("UPDATE tasks SET user_id = $1, context_id = $2, project_id = $3, title = $4, description = $5, state = $6, verification_list = $7, important_fixed = $8, date_added = $9, date_completed = $10, date_limit = $11, date_changed = $12, num_version = $13, completed = $14 WHERE task_id = $15 RETURNING task_id",
        [task.user_id, task.context_id, task.project_id, task.title, task.description, task.state, task.verification_list, task.important_fixed, task.date_added, task.date_completed, task.date_limit, task.date_changed, task.num_version, task.completed, task_id]);
    if (res.rowCount !== 1) {
        throw new Error('The task does not exist');
    } else {
        return res.rowCount === 1 ? res.rows[0].task_id : -1;
    }
}

function SyncronizeTask(oldTask, newTask) {

}


function completeTaskDefValues(task) {
    if (!task.user_id || !task.title || task.title.length === 0) {
        throw new Error('Invalid Task data');
    }

    if (!task.state) {
        task.state = 1; //Inbox default
    }
    task.completed = false;
    task.date_added = new Date();
    task.date_changed = new Date();
    task.num_version = 1;

    if (!task.important_fixed) {
        task.important_fixed = false;
    }

    if (task.date_limit) {
        console.log("TASK DATE LIMIT CREATE", task.date_limit, new Date(task.date_limit).getTime(), new Date(2024, 2, 26).getTime())
        task.date_limit = new Date(new Date(task.date_limit).getTime())
        task.state = 3;
    }

    return task
}

function updateTaskDefValues(task, newTask) {


    if (!task.user_id || (task.title && task.title.length === 0)) {
        throw new Error('Invalid Task data');
    }

    task.date_changed = new Date();
    task.num_version = parseInt(task.num_version);
    task.num_version += 1;

    if (newTask.completed) {
        task.date_completed = new Date();
    }

    if (newTask.state && newTask.state !== task.state && parseInt(task.state) === 3) {
        task.date_limit = null;
        newTask.date_limit = null;
    }

    if (newTask.date_limit) {
        console.log("TASK DATE LIMIT CREATE", newTask.date_limit, new Date(newTask.date_limit).getTime(), new Date(2024, 1, 26).getTime())
        //Convert ISO Date to Time and then to System Date
        newTask.date_limit = new Date(new Date(newTask.date_limit).getTime())
    }

    newTask = Object.assign(task, newTask)

    return newTask
}



function addFiltersToQuery(query, filters) {
    let finalQuery = query;
    let nextParam = 0;
    const paramNumbers = ["$2", "$3", "$4", "$5", "$6", "$7", "$8", "$9", "$10"]
    let finalFilters = {}

    if (filters.context_id) {
        //Filter by list of context_id 
        if (filters.context_id.includes(",") && filters.context_id.split(",").length > 1) {
            finalQuery = finalQuery.concat(" AND t.context_id IN (select con.context_id from areas_contexts con where con.context_id = ANY(")
            finalQuery = finalQuery.concat(paramNumbers[nextParam++]);
            finalQuery = finalQuery.concat("))");
            finalFilters.context_id = filters.context_id.split(",");

            finalFilters.context_id = finalFilters.context_id.map(e => {
                return parseInt(e);
            })
        } else {
            //Filter by only one context_id
            finalQuery = finalQuery.concat(" AND t.context_id = ")
            finalQuery = finalQuery.concat(paramNumbers[nextParam++]);
            finalFilters.context_id = filters.context_id;
        }
    }

    if (filters.project_id) {
        //Filter by list of project_id 
        if (filters.project_id.includes(",") && filters.project_id.split(",").length > 1) {
            finalQuery = finalQuery.concat(" AND t.project_id IN (select pro.project_id from projects pro where pro.project_id = ANY(")
            finalQuery = finalQuery.concat(paramNumbers[nextParam++]);
            finalQuery = finalQuery.concat("))");
            finalFilters.project_id = filters.project_id.split(",");

            finalFilters.project_id = finalFilters.project_id.map(e => {
                return parseInt(e);
            })
        } else {
            //Filter by only one project_id
            finalQuery = finalQuery.concat(" AND t.project_id = ")
            finalQuery = finalQuery.concat(paramNumbers[nextParam++]);
            finalFilters.project_id = filters.project_id;
        }
    }

    if (filters.state) {
        if (filters.state !== '0' && filters.state !== '6') {
            finalQuery = finalQuery.concat(" AND t.state = ")
            finalQuery = finalQuery.concat(paramNumbers[nextParam++]);
            finalFilters.state = filters.state;
        } else if (filters.state === '6') {
            const fechaActual = new Date();
            finalQuery = finalQuery.concat(" AND t.date_limit < ")
            finalQuery = finalQuery.concat(paramNumbers[nextParam++])
            finalFilters.today = fechaActual;
        } else {
            const fechaActual = new Date();
            const fechaManana = new Date();
            fechaManana.setDate(fechaManana.getDate() + 1);
            finalQuery = finalQuery.concat(" AND t.date_limit >= ")
            finalQuery = finalQuery.concat(paramNumbers[nextParam++])
            finalQuery = finalQuery.concat(" AND t.date_limit < ")
            finalQuery = finalQuery.concat(paramNumbers[nextParam++])
            finalFilters.today = fechaActual;
            finalFilters.yesterday = fechaManana;
        }
    }

    if (filters.completed) {
        finalQuery = finalQuery.concat(" AND t.completed = ")
        filters.completed = (/true/i).test(filters.completed);
        finalQuery = finalQuery.concat(paramNumbers[nextParam++]);
        finalFilters.completed = filters.completed;
    }

    if (filters.date_limit) {
        if (filters.date_limit === '?') {
            finalQuery = finalQuery.concat(" AND t.date_limit is not null")
        } else if (filters.date_limit === 'null') {
            finalQuery = finalQuery.concat(" AND t.date_limit is null")
        } else if (Date.parse(filters.date_limit)) {
            finalQuery = finalQuery.concat(" AND t.date_limit = ")
            finalQuery = finalQuery.concat(paramNumbers[nextParam++]);
            finalFilters.date_limit = new Date(filters.date_limit);
        }
    }

    if (filters.important_fixed) {
        finalQuery = finalQuery.concat(" AND t.important_fixed = ")
        filters.important_fixed = (/true/i).test(filters.important_fixed);
        finalQuery = finalQuery.concat(paramNumbers[nextParam++]);
        finalFilters.important_fixed = filters.important_fixed;
    }


    if (filters.tags) {
        finalQuery = finalQuery.concat(" AND t.task_id IN (select tg.task_id from tagstotask tg where tg.nametag = ANY(");
        finalQuery = finalQuery.concat(paramNumbers[nextParam++]);
        finalQuery = finalQuery.concat("))");
        finalFilters.tags = filters.tags.split(",");
    }


    if (filters.date_limit) {
        finalQuery = finalQuery.concat(" order by t.date_limit, t.important_fixed DESC");
    }
    else if (filters.state) {
        if (filters.state === '0') {
            finalQuery = finalQuery.concat(" group by p.project_id, t.task_id, t.title, c.name, t2.tags, t2.tagcolors order by case when p.project_id is null then 0 else 1 end, t.important_fixed DESC");
        }
    }
    else {
        finalQuery = finalQuery.concat(" order by t.important_fixed DESC");
    }

    if (filters.limit) {
        finalQuery = finalQuery.concat(" limit 6");
    }

    console.log("FinalFilters: ", finalFilters)
    return { query: finalQuery, values: Object.values(finalFilters) };
}

module.exports = taskService;