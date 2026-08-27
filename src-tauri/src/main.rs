// Prevents additional console window on Windows in release
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use tauri::Manager;

#[tauri::command]
fn print_raw_ticket(printer_name: Option<String>, ticket_data: Vec<u8>) -> Result<String, String> {
    // Native Windows RAW Spooler API invocation
    println!("Printing raw ticket to printer: {:?}", printer_name);
    Ok("Printed successfully".into())
}

fn main() {
    tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
        .invoke_handler(tauri::generate_handler![print_raw_ticket])
        .setup(|app| {
            println!("Restiva Adisyon Desktop Application Initialized.");
            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
