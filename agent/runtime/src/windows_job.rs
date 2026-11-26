//! An owned Windows job terminates the entire engine tree when the scope ends.
use std::{os::windows::io::AsRawHandle, process::Child};
use windows_sys::Win32::{
    Foundation::{CloseHandle, HANDLE},
    System::JobObjects::{
        AssignProcessToJobObject, CreateJobObjectW, JobObjectExtendedLimitInformation,
        SetInformationJobObject, JOBOBJECT_EXTENDED_LIMIT_INFORMATION,
        JOB_OBJECT_LIMIT_KILL_ON_JOB_CLOSE,
    },
};
pub struct Job(HANDLE);
impl Job {
    pub fn attach(child: &mut Child) -> Result<Self, String> {
        // SAFETY: every handle is checked before use and owned by the returned Job,
        // which closes it exactly once.
        // nosemgrep: rust.lang.security.unsafe-usage.unsafe-usage
        unsafe {
            let handle = CreateJobObjectW(std::ptr::null(), std::ptr::null());
            if handle.is_null() {
                let _ = child.kill();
                let _ = child.wait();
                return Err("engine_isolation_failed".into());
            }
            let job = Self(handle);
            let mut limits: JOBOBJECT_EXTENDED_LIMIT_INFORMATION = std::mem::zeroed();
            limits.BasicLimitInformation.LimitFlags = JOB_OBJECT_LIMIT_KILL_ON_JOB_CLOSE;
            if SetInformationJobObject(
                handle,
                JobObjectExtendedLimitInformation,
                &limits as *const _ as *const _,
                std::mem::size_of_val(&limits) as u32,
            ) == 0
                || AssignProcessToJobObject(handle, child.as_raw_handle() as HANDLE) == 0
            {
                let _ = child.kill();
                let _ = child.wait();
                return Err("engine_isolation_failed".into());
            }
            Ok(job)
        }
    }
}
impl Drop for Job {
    fn drop(&mut self) {
        // SAFETY: the handle was created by attach and is closed only here.
        // nosemgrep: rust.lang.security.unsafe-usage.unsafe-usage
        unsafe {
            CloseHandle(self.0);
        }
    }
}
