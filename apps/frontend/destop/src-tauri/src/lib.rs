use serde::Serialize;
use std::fs;
use std::path::{Path, PathBuf};

#[derive(Serialize, Clone)]
struct FsEntry {
    name: String,
    path: String,
    is_dir: bool,
    depth: usize,
}

#[derive(Serialize)]
struct FilePayload {
    path: String,
    content: String,
    size: usize,
}

#[tauri::command]
fn get_workspace_root() -> Result<String, String> {
    std::env::current_dir()
        .map(|path| path.to_string_lossy().to_string())
        .map_err(|err| err.to_string())
}

#[tauri::command]
fn create_project(project_name: String, mod_name: String) -> Result<String, String> {
    let project_input = project_name.trim();
    if project_input.is_empty() {
        return Err("project_name is required.".to_string());
    }

    let mod_raw = mod_name.trim();
    let mod_core = mod_raw
        .strip_prefix("mod")
        .or_else(|| mod_raw.strip_prefix("MOD"))
        .unwrap_or(mod_raw)
        .trim();
    if mod_core.is_empty() {
        return Err("mod_name is required.".to_string());
    }

    let root_candidate = PathBuf::from(project_input);
    let root = if root_candidate.is_absolute() {
        root_candidate
    } else {
        std::env::current_dir()
            .map_err(|err| err.to_string())?
            .join(root_candidate)
    };

    let project_tail = root
        .file_name()
        .map(|name| name.to_string_lossy().to_string())
        .unwrap_or_else(|| project_input.to_string());
    let mod_dir_name = format!("mod{}", mod_core);
    let mod_root = root.join("plugins").join("Next").join(&mod_dir_name);
    let directories = [
        mod_root.join("Assets"),
        mod_root.join("Assets").join("Buff Icon"),
        mod_root.join("Assets").join("Item Icon"),
        mod_root.join("Assets").join("skill Icon"),
        mod_root.join("Assets").join("StaticSkill Icon"),
        mod_root.join("Config"),
        mod_root.join("Data"),
        mod_root.join("Data").join("BuffJsonData"),
        mod_root.join("Data").join("BuffSeidJsonData"),
        mod_root.join("Data").join("CrateAvatarSeidJsonData"),
        mod_root.join("Data").join("EquipSeidJsonData"),
        mod_root.join("Data").join("ItemJsonData"),
        mod_root.join("Data").join("ItemsSeidJsonData"),
        mod_root.join("Data").join("skillJsonData"),
        mod_root.join("Data").join("SkillSeidJsonData"),
        mod_root.join("Data").join("StaticSkillSeidJsonData"),
        mod_root.join("Data").join("WuDaoSeidJsonData"),
        mod_root.join("Lua"),
        mod_root.join("NData"),
        mod_root.join("NData").join("CustomFace"),
        mod_root.join("NData").join("DialogEvent"),
        mod_root.join("NData").join("DialogTrigger"),
        mod_root.join("NData").join("FungusPatch"),
    ];
    for dir in directories {
        fs::create_dir_all(dir).map_err(|err| err.to_string())?;
    }

    fs::write(
        mod_root.join("Config").join("modConfig.json"),
        format!(
            "{{\n  \"Name\": \"{}\",\n  \"Author\": \"\",\n  \"Version\": \"0.0.1\",\n  \"Description\": \"\",\n  \"Settings\": []\n}}\n",
            project_tail
        ),
    )
    .map_err(|err| err.to_string())?;
    fs::write(mod_root.join("Data").join("StaticSkillJsonData.json"), "{\n\n}\n")
        .map_err(|err| err.to_string())?;
    fs::write(mod_root.join("Data").join("CreateAvatarJsonData.json"), "{\n\n}\n")
        .map_err(|err| err.to_string())?;

    Ok(root.to_string_lossy().to_string())
}

#[tauri::command]
fn load_project_entries(root_path: String) -> Result<Vec<FsEntry>, String> {
    let root = PathBuf::from(root_path.trim());
    if !root.exists() || !root.is_dir() {
        return Err("Project path does not exist or is not a directory.".to_string());
    }

    let mut entries = Vec::new();
    collect_entries(&root, 0, &mut entries)?;
    Ok(entries)
}

fn collect_entries(current: &Path, depth: usize, out: &mut Vec<FsEntry>) -> Result<(), String> {
    let mut dir_items = Vec::new();
    let mut file_items = Vec::new();

    for item in fs::read_dir(current).map_err(|err| err.to_string())? {
        let item = item.map_err(|err| err.to_string())?;
        let path = item.path();
        let name = item.file_name().to_string_lossy().to_string();
        if path.is_dir() {
            dir_items.push((name, path));
        } else {
            file_items.push((name, path));
        }
    }

    dir_items.sort_by(|a, b| a.0.cmp(&b.0));
    file_items.sort_by(|a, b| a.0.cmp(&b.0));

    for (name, path) in dir_items {
        out.push(FsEntry {
            name,
            path: path.to_string_lossy().to_string(),
            is_dir: true,
            depth,
        });
        collect_entries(&path, depth + 1, out)?;
    }

    for (name, path) in file_items {
        out.push(FsEntry {
            name,
            path: path.to_string_lossy().to_string(),
            is_dir: false,
            depth,
        });
    }

    Ok(())
}

#[tauri::command]
fn read_file_payload(file_path: String) -> Result<FilePayload, String> {
    let path = PathBuf::from(file_path.trim());
    if path.is_dir() {
        return Err("Expected a file but got a directory.".to_string());
    }

    let bytes = fs::read(&path).map_err(|err| err.to_string())?;
    let content = String::from_utf8_lossy(&bytes).to_string();
    Ok(FilePayload {
        path: path.to_string_lossy().to_string(),
        size: bytes.len(),
        content,
    })
}

#[tauri::command]
fn save_file_payload(file_path: String, content: String) -> Result<(), String> {
    let path = PathBuf::from(file_path.trim());
    if let Some(parent) = path.parent() {
        fs::create_dir_all(parent).map_err(|err| err.to_string())?;
    }
    fs::write(path, content).map_err(|err| err.to_string())
}

#[tauri::command]
fn ensure_mod_structure(mod_root_path: String) -> Result<(), String> {
    let mod_root = PathBuf::from(mod_root_path.trim());
    let directories = [
        mod_root.join("Assets"),
        mod_root.join("Assets").join("Buff Icon"),
        mod_root.join("Assets").join("Item Icon"),
        mod_root.join("Assets").join("skill Icon"),
        mod_root.join("Assets").join("StaticSkill Icon"),
        mod_root.join("Config"),
        mod_root.join("Data"),
        mod_root.join("Data").join("BuffJsonData"),
        mod_root.join("Data").join("BuffSeidJsonData"),
        mod_root.join("Data").join("CrateAvatarSeidJsonData"),
        mod_root.join("Data").join("EquipSeidJsonData"),
        mod_root.join("Data").join("ItemJsonData"),
        mod_root.join("Data").join("ItemsSeidJsonData"),
        mod_root.join("Data").join("skillJsonData"),
        mod_root.join("Data").join("SkillSeidJsonData"),
        mod_root.join("Data").join("StaticSkillSeidJsonData"),
        mod_root.join("Data").join("WuDaoSeidJsonData"),
        mod_root.join("Lua"),
        mod_root.join("NData"),
        mod_root.join("NData").join("CustomFace"),
        mod_root.join("NData").join("DialogEvent"),
        mod_root.join("NData").join("DialogTrigger"),
        mod_root.join("NData").join("FungusPatch"),
    ];
    for dir in directories {
        fs::create_dir_all(dir).map_err(|err| err.to_string())?;
    }

    let static_skill = mod_root.join("Data").join("StaticSkillJsonData.json");
    if !static_skill.exists() {
        fs::write(static_skill, "{\n\n}\n").map_err(|err| err.to_string())?;
    }

    let create_avatar = mod_root.join("Data").join("CreateAvatarJsonData.json");
    if !create_avatar.exists() {
        fs::write(create_avatar, "{\n\n}\n").map_err(|err| err.to_string())?;
    }

    Ok(())
}

#[tauri::command]
fn rename_mod_folder(mod_root_path: String, new_mod_name: String) -> Result<String, String> {
    let old_path = PathBuf::from(mod_root_path.trim());
    if !old_path.exists() || !old_path.is_dir() {
        return Err("mod folder does not exist.".to_string());
    }

    let mod_raw = new_mod_name.trim();
    let mod_core = mod_raw
        .strip_prefix("mod")
        .or_else(|| mod_raw.strip_prefix("MOD"))
        .unwrap_or(mod_raw)
        .trim();
    if mod_core.is_empty() {
        return Err("new mod name is required.".to_string());
    }

    let parent = old_path
        .parent()
        .ok_or_else(|| "cannot resolve mod parent directory.".to_string())?;
    let new_path = parent.join(format!("mod{}", mod_core));

    if new_path == old_path {
        return Ok(old_path.to_string_lossy().to_string());
    }
    if new_path.exists() {
        return Err("target mod folder already exists.".to_string());
    }

    fs::rename(&old_path, &new_path).map_err(|err| err.to_string())?;
    Ok(new_path.to_string_lossy().to_string())
}

#[tauri::command]
fn delete_mod_folder(mod_root_path: String) -> Result<(), String> {
    let path = PathBuf::from(mod_root_path.trim());
    if !path.exists() {
        return Ok(());
    }
    if !path.is_dir() {
        return Err("target is not a directory.".to_string());
    }
    fs::remove_dir_all(path).map_err(|err| err.to_string())
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_dialog::init())
        .invoke_handler(tauri::generate_handler![
            get_workspace_root,
            create_project,
            load_project_entries,
            read_file_payload,
            save_file_payload,
            ensure_mod_structure,
            rename_mod_folder,
            delete_mod_folder
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
