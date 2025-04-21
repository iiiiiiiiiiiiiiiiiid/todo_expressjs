import sb from "./dbconn.js";
import multer from 'multer';
import axios from 'axios';

const upload = multer({storage: multer.memoryStorage()});

export const tid_download_image = async (req, res) => {
    const {tid} = req.params;
    if(!tid)
        return res.status(400).json({error: "Where is my task dude"});

    try {
        const {data, error} = await sb
            .from("tasks")
            .select("image")
            .eq("id", tid)
            .single();

    if(error){
        console.error("You lied to me??:", error);
        return res.status(500).json({error: error.message});
    }

    if(!data || !data.image){
        return res.status(404).json({error: "Croissants are missing. Or your image. One or the other."});
    }

    const filename = data.image;

    const {data: url_data, error: url_error} = sb
        .storage
        .from("images-for-tasks")
        .getPublicUrl(filename);

    if(url_error || !url_data?.publicUrl) {
        console.error("Generation URL not", url_error);
        return res.status(500).json({error: "Not URL generation"});
    }

    const image_url = url_data.publicUrl;

    const image_response = await axios.get(image_url, {responseType: "stream"});

    res.setHeader("Content-type", image_response.headers['content-type']);

    image_response.data.pipe(res);
    }catch(err){
        console.error("Wow, an error!:", err);
        res.status(500).json({error: "Internal server error"});
    }
}

export const tid_retrieve_image = async (req, res) => {
    const {tid} = req.params;

    if(!tid)
        return res.status(400).json({error: "Missing tid"});

    try{
        const {data, error} = await sb
            .from('tasks')
            .select("image")
            .eq("id", tid)
            .single();

        if(error){
            console.error("It's supabase's fault:", error);
            return res.status(500).json({error: error.message});
        }

        if(!data || !data.image) 
            return res.status(404).json({error: "Some input is missing"});
    
        const {data: public_url_data, error: url_error} = sb
            .storage
            .from("images-for-tasks")
            .getPublicUrl(data.image);


        if(url_error) {
            console.error("Supabase has betrayed you yet again. For how long will you put up with this?!", url_error);
            return res.status(500).json({error: url_error.message});
        }

        res.json({image: public_url_data.publicUrl});


    }catch(err){
        console.error("Server error:", err);
    }
}

export const task_add_image = [
    upload.single("image"),
    async (req, res) => {
        const user = await sb.auth.getUser();
        if (!user) {
            return res.status(401).json({ error: "Unauthorized" });
        }


        const {tid} = req.params;
        const email_ = req.user.email;
        const file = req.file;

        if(!file)
            return res.status(400).json({error: "Invalid or imcomplete input"});
        if(!tid)
            return res.status(400).json({error: "You don't actually exist"});
        
        const file_ext = file.originalname.split('.').pop();
        const filename = `task_${tid}_${Date.now()}.${file_ext}`;
        const bucket_name = 'images-for-tasks';

        const {error: uploadError} = await sb.storage
            .from(bucket_name)
            .upload(filename, file.buffer, {
                contentType: file.mimetype
            });

            if(uploadError) {
                console.error("Image no upload happen:", uploadError);
                return res.status(500).json({error: "Upload no happen image"});
            }

            try{
                const {data, error} = await sb.rpc("task_add_image", {
                   
                    eml: email_,
                    img: filename,
                    tid: tid,
                });

                if(error) {
                    console.error("Supabase function somehow failed:", error);
                    return res.status(500).json({error: error.message});
                }
                
                res.json(data);
            } catch(err){
                console.error("Server betrayed you:", err);
                res.status(500).json({error: "Server really did betray you"});
            }
    }
];


export const task_add = async (req, res) => {
    const { category, txt } = req.body;

    try {
        const { data, error } = await sb.rpc('task_add', {
            category, txt, eml: req.user.email
        });

        if (error) {
            console.error('Supabase function error:', error);
            return res.status(500).json({ error: error.message });
        }

        res.json(data);
    } catch (err) {
        console.error('Server error:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
};

export const task_complete = async (req, res) => {
    try {
        let { data, error } = await sb
            .rpc('task_complete', { tid:req.params.id, email:req.user.email });

        if (error) {
            console.error('Supabase function error:', error);
            return res.status(500).json({ error: error.message });
        }

        res.json(data);
    } catch (err) {
        console.error('Server error:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
};

export const task_delete = async (req, res) => {
    const {tid} = req.params;
    try {
        let { data, error } = await sb
            .rpc('task_delete', { task:tid, email:req.user.email });

        if (error) {
            console.error('Supabase function error:', error);
            return res.status(500).json({ error: error.message });
        }
        res.json();
    } catch (err) {
        console.error('Server error:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
};

export const task_get_all = async (req, res) => {
    try {
        const page = req.params.page;
        console.log(page);
        const pageSize = 3;

        const since = (page - 1) * pageSize;
        const till = since + pageSize - 1;

        const { data, error } = await sb
            .rpc('task_get_all', {
                email: req.user.email,
                since,
                till
            });

        if (error) {
            console.error('Supabase function error:', error);
            return res.status(500).json({ error: error.message });
        }

        res.json(data);
    } catch (err) {
        console.error('Server error:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
}

export const task_add_tag = async (req, res) => {
    const {tag_txt} = req.body;
    const {id} = req.params;
    try {
        let {data, error} = await sb
            .rpc("task_add_tag", {task_id: id, tag_txt, email: req.user.email});

        if(error) {
            console.error('Supabase function error:', error);
            return res.status(500).json({ error: error.message });
        }

        res.json(data);
    } catch (err) {
        console.error('Server error:', err);
        res.status(500).json({error: "INternal server error"});
    }
}

export const task_rename= async (req, res) => {
    const {id} = req.params;
    const {newname} = req.body ;

    if(!(await is_task_mine(req.user.email, id))){

        return res.status(401).json({message: "Denied."})


    }

    try{
        let {data, error} = await sb
        .rpc("task_update", {tid: id, newtask: newname, email: req.user.email});
 
        if(error) {
            console.error('Supabase function error:', error);
            return res.status(500).json({ error: error.message });
        }

        res.json(data);
    } catch (err) {
        console.error('Server error:', err);
        res.status(500).json({error: "INternal server error"});
    }
}

export const is_task_mine = async (email, task_id) => {
    let {data, error} = await sb
    .rpc("get_email_by_task_id", {task_id});
    if(!error) console.log("'Tis fine!"); // Yes, I know it isn't a smart error check

    return (email == data);
}