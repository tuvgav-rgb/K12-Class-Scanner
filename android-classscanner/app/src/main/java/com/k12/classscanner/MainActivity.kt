package com.k12.classscanner

import android.Manifest
import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import androidx.activity.result.contract.ActivityResultContracts
import androidx.camera.core.CameraSelector
import androidx.camera.core.ImageAnalysis
import androidx.camera.core.Preview
import androidx.camera.lifecycle.ProcessCameraProvider
import androidx.camera.view.PreviewView
import androidx.compose.foundation.layout.aspectRatio
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxHeight
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.layout.widthIn
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.Assignment
import androidx.compose.material.icons.automirrored.filled.List
import androidx.compose.material.icons.filled.Add
import androidx.compose.material.icons.filled.Assessment
import androidx.compose.material.icons.filled.CardGiftcard
import androidx.compose.material.icons.filled.CheckCircle
import androidx.compose.material.icons.filled.Close
import androidx.compose.material.icons.filled.CreditCard
import androidx.compose.material.icons.filled.Dashboard
import androidx.compose.material.icons.filled.Groups
import androidx.compose.material.icons.filled.QrCodeScanner
import androidx.compose.material.icons.filled.Redeem
import androidx.compose.material.icons.filled.Star
import androidx.compose.material.icons.filled.Storefront
import androidx.compose.material3.AssistChip
import androidx.compose.material3.Button
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.CenterAlignedTopAppBar
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.FilterChip
import androidx.compose.material3.FilledTonalButton
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.NavigationBar
import androidx.compose.material3.NavigationBarItem
import androidx.compose.material3.NavigationRail
import androidx.compose.material3.NavigationRailItem
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Scaffold
import androidx.compose.material3.SnackbarHost
import androidx.compose.material3.SnackbarHostState
import androidx.compose.material3.Text
import androidx.compose.material3.TopAppBarDefaults
import androidx.compose.runtime.Composable
import androidx.compose.runtime.DisposableEffect
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateListOf
import androidx.compose.runtime.mutableIntStateOf
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.viewinterop.AndroidView
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.platform.LocalLifecycleOwner
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.compose.ui.window.Dialog
import androidx.core.content.ContextCompat
import com.google.mlkit.vision.barcode.BarcodeScanning
import com.google.mlkit.vision.common.InputImage
import kotlinx.coroutines.launch
import org.json.JSONArray
import org.json.JSONObject
import java.util.concurrent.atomic.AtomicBoolean

private val Navy = Color(0xFF17253F)
private val Ink = Color(0xFF1D2939)
private val Canvas = Color(0xFFF4F7FB)
private val Blue = Color(0xFF2459C6)
private val Gold = Color(0xFFB36A00)
private val Mint = Color(0xFF007B68)

class MainActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        enableEdgeToEdge()
        setContent { ClassScannerApp() }
    }
}

private data class Student(val id: String, val name: String, var points: Int, val grade: String)
private data class Assignment(val id: String, val name: String, val subject: String, val reward: Int, val doneBy: MutableSet<String> = mutableSetOf())
private data class StoreItem(val id: String, val name: String, val cost: Int, var stock: Int, val category: String)
private data class Reward(val id: String, val name: String, val points: Int, var awards: Int = 0)
private data class ScanEvent(val title: String, val detail: String, val success: Boolean)
private enum class Screen(val label: String, val icon: ImageVector) {
    Dashboard("Home", Icons.Default.Dashboard),
    Roster("Roster", Icons.Default.Groups),
    Assignments("Work", Icons.AutoMirrored.Filled.Assignment),
    Store("Store", Icons.Default.Storefront),
    Rewards("Rewards", Icons.Default.CardGiftcard),
    Reports("Reports", Icons.Default.Assessment)
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
private fun ClassScannerApp() {
    val students = remember { mutableStateListOf(
        Student("STU1001", "Alex Morgan", 175, "5A"), Student("STU1002", "Jordan Lee", 130, "5A"),
        Student("STU1003", "Maya Patel", 220, "5A"), Student("STU1004", "Noah Williams", 95, "5A"),
        Student("STU1005", "Sofia Chen", 160, "5A")
    ) }
    val assignments = remember { mutableStateListOf(
        Assignment("ASM201", "Fractions practice", "Math", 15, mutableSetOf("STU1001", "STU1003")),
        Assignment("ASM202", "Reading response", "ELA", 10, mutableSetOf("STU1002", "STU1003", "STU1005")),
        Assignment("ASM203", "Ecosystem observation", "Science", 20, mutableSetOf("STU1001"))
    ) }
    val inventory = remember { mutableStateListOf(
        StoreItem("ITM101", "Teacher's assistant", 150, 2, "Privilege"), StoreItem("ITM104", "Mechanical pencil", 40, 12, "Supply"),
        StoreItem("ITM106", "Fruit snacks", 25, 20, "Snack"), StoreItem("ITM108", "Sticker pack", 15, 35, "Prize")
    ) }
    val rewards = remember { mutableStateListOf(Reward("REW101", "Star participation", 10), Reward("REW102", "Superb effort", 25), Reward("REW103", "Bonus points", 5)) }
    val logs = remember { mutableStateListOf<ScanEvent>() }
    var screen by remember { mutableStateOf(Screen.Dashboard) }
    var activeStudentId by remember { mutableStateOf<String?>(null) }
    var activeAssignmentId by remember { mutableStateOf(assignments.first().id) }
    var activeRewardId by remember { mutableStateOf(rewards.first().id) }
    var scanText by remember { mutableStateOf("") }
    var revision by remember { mutableIntStateOf(0) }
    var cameraOpen by remember { mutableStateOf(false) }
    val snackbar = remember { SnackbarHostState() }
    val scope = rememberCoroutineScope()
    val context = LocalContext.current
    val database = remember { ClassScannerDatabase.get(context) }
    val isTablet = androidx.compose.ui.platform.LocalConfiguration.current.screenWidthDp >= 700
    val activeStudent = students.find { it.id == activeStudentId }
    val stateVersion = revision

    LaunchedEffect(database) {
        database.snapshots().get()?.let { snapshot ->
            restoreSnapshot(snapshot.json, students, assignments, inventory, rewards, logs)
            revision++
        }
    }

    fun persist() {
        revision++
        scope.launch {
            database.snapshots().save(
                ClassroomSnapshot(encodeSnapshot(students, assignments, inventory, rewards, logs))
            )
        }
    }

    fun announce(text: String, success: Boolean = true) {
        logs.add(0, ScanEvent(if (success) "Scan complete" else "Scan needs attention", text, success))
        if (logs.size > 50) logs.removeLast()
        persist()
        scope.launch { snackbar.showSnackbar(text) }
    }

    val requestCameraPermission = androidx.activity.compose.rememberLauncherForActivityResult(
        ActivityResultContracts.RequestPermission()
    ) { granted ->
        if (granted) cameraOpen = true else announce("Camera permission is needed to scan with the device camera.", false)
    }
    fun handleScan(raw: String) {
        val code = raw.trim().uppercase()
        if (code.isEmpty()) return
        val student = students.find { it.id == code }
        val assignment = assignments.find { it.id == code }
        val item = inventory.find { it.id == code }
        when {
            student != null && screen == Screen.Rewards -> {
                val reward = rewards.find { it.id == activeRewardId }!!
                student.points += reward.points; reward.awards++
                announce("${student.name} received ${reward.name}: +${reward.points} points")
            }
            student != null && screen == Screen.Assignments -> {
                val task = assignments.find { it.id == activeAssignmentId }!!
                if (task.doneBy.add(student.id)) student.points += task.reward
                announce("${student.name} marked complete for ${task.name}")
            }
            student != null -> { activeStudentId = student.id; announce("${student.name} selected (${student.points} points)") }
            assignment != null -> { activeAssignmentId = assignment.id; announce("Active assignment: ${assignment.name}") }
            item != null && activeStudent != null -> {
                if (item.stock <= 0) announce("${item.name} is out of stock", false)
                else if (activeStudent.points < item.cost) announce("${activeStudent.name} needs ${item.cost - activeStudent.points} more points", false)
                else { activeStudent.points -= item.cost; item.stock--; announce("${activeStudent.name} redeemed ${item.name}") }
            }
            item != null -> announce("Select or scan a student before redeeming ${item.name}", false)
            else -> announce("No student, assignment, or item matches $code", false)
        }
        scanText = ""
    }

    MaterialTheme(colorScheme = MaterialTheme.colorScheme.copy(primary = Blue, secondary = Mint, tertiary = Gold, background = Canvas)) {
        Scaffold(
            snackbarHost = { SnackbarHost(snackbar) },
            topBar = { CenterAlignedTopAppBar(title = { Text("K12 ClassScanner", fontWeight = FontWeight.Black, letterSpacing = 0.sp) }, colors = TopAppBarDefaults.centerAlignedTopAppBarColors(containerColor = Color.White)) },
            bottomBar = { if (!isTablet) AppBottomBar(screen) { screen = it } }
        ) { padding ->
            Row(Modifier.fillMaxSize().padding(padding).background(Canvas)) {
                if (isTablet) AppRail(screen) { screen = it }
                Column(Modifier.weight(1f).fillMaxHeight()) {
                    stateVersion
                    ScanBar(
                        scanText,
                        { scanText = it },
                        { handleScan(scanText) },
                        { requestCameraPermission.launch(Manifest.permission.CAMERA) },
                        activeStudent?.name
                    )
                    when (screen) {
                        Screen.Dashboard -> Dashboard(students, assignments, inventory, logs, { screen = it })
                        Screen.Roster -> Roster(students, activeStudentId, { activeStudentId = it }, { student, amount -> student.points = (student.points + amount).coerceAtLeast(0); announce("${student.name}: ${if (amount > 0) "+" else ""}$amount points") })
                        Screen.Assignments -> Assignments(assignments, students, activeAssignmentId, { activeAssignmentId = it })
                        Screen.Store -> Store(inventory, activeStudent, { item -> handleScan(item.id) })
                        Screen.Rewards -> Rewards(rewards, activeRewardId, { activeRewardId = it }, students, { student -> handleScan(student.id) })
                        Screen.Reports -> Reports(students, assignments, logs)
                    }
                }
            }
        }
        if (cameraOpen) {
            BarcodeCameraDialog(
                onDismiss = { cameraOpen = false },
                onBarcode = { code -> cameraOpen = false; handleScan(code) }
            )
        }
    }
}

private fun encodeSnapshot(
    students: List<Student>,
    assignments: List<Assignment>,
    inventory: List<StoreItem>,
    rewards: List<Reward>,
    logs: List<ScanEvent>
): String = JSONObject().apply {
    put("students", JSONArray().apply { students.forEach { put(JSONObject().apply { put("id", it.id); put("name", it.name); put("points", it.points); put("grade", it.grade) }) } })
    put("assignments", JSONArray().apply { assignments.forEach { task -> put(JSONObject().apply { put("id", task.id); put("name", task.name); put("subject", task.subject); put("reward", task.reward); put("doneBy", JSONArray(task.doneBy.toList())) }) } })
    put("inventory", JSONArray().apply { inventory.forEach { put(JSONObject().apply { put("id", it.id); put("name", it.name); put("cost", it.cost); put("stock", it.stock); put("category", it.category) }) } })
    put("rewards", JSONArray().apply { rewards.forEach { put(JSONObject().apply { put("id", it.id); put("name", it.name); put("points", it.points); put("awards", it.awards) }) } })
    put("logs", JSONArray().apply { logs.forEach { put(JSONObject().apply { put("title", it.title); put("detail", it.detail); put("success", it.success) }) } })
}.toString()

private fun restoreSnapshot(
    raw: String,
    students: MutableList<Student>,
    assignments: MutableList<Assignment>,
    inventory: MutableList<StoreItem>,
    rewards: MutableList<Reward>,
    logs: MutableList<ScanEvent>
) {
    runCatching {
        val snapshot = JSONObject(raw)
        fun array(key: String) = snapshot.getJSONArray(key)
        students.apply { clear(); array("students").forEachJsonObject { add(Student(it.getString("id"), it.getString("name"), it.getInt("points"), it.getString("grade"))) } }
        assignments.apply { clear(); array("assignments").forEachJsonObject { task ->
            val done = mutableSetOf<String>(); task.getJSONArray("doneBy").forEachValue { done.add(it.toString()) }
            add(Assignment(task.getString("id"), task.getString("name"), task.getString("subject"), task.getInt("reward"), done))
        } }
        inventory.apply { clear(); array("inventory").forEachJsonObject { add(StoreItem(it.getString("id"), it.getString("name"), it.getInt("cost"), it.getInt("stock"), it.getString("category"))) } }
        rewards.apply { clear(); array("rewards").forEachJsonObject { add(Reward(it.getString("id"), it.getString("name"), it.getInt("points"), it.getInt("awards"))) } }
        logs.apply { clear(); array("logs").forEachJsonObject { add(ScanEvent(it.getString("title"), it.getString("detail"), it.getBoolean("success"))) } }
    }
}

private fun JSONArray.forEachJsonObject(action: (JSONObject) -> Unit) {
    for (index in 0 until length()) action(getJSONObject(index))
}

private fun JSONArray.forEachValue(action: (Any) -> Unit) {
    for (index in 0 until length()) action(get(index))
}

@Composable private fun AppRail(selected: Screen, select: (Screen) -> Unit) = NavigationRail(containerColor = Color.White) {
    Spacer(Modifier.height(12.dp)); Icon(Icons.Default.QrCodeScanner, null, tint = Blue, modifier = Modifier.size(30.dp)); Spacer(Modifier.height(20.dp))
    Screen.entries.forEach { item -> NavigationRailItem(selected = selected == item, onClick = { select(item) }, icon = { Icon(item.icon, item.label) }, label = { Text(item.label) }) }
}
@Composable private fun AppBottomBar(selected: Screen, select: (Screen) -> Unit) = NavigationBar(containerColor = Color.White) {
    Screen.entries.take(5).forEach { item -> NavigationBarItem(selected = selected == item, onClick = { select(item) }, icon = { Icon(item.icon, item.label) }, label = { Text(item.label) }) }
}

@Composable private fun ScanBar(value: String, update: (String) -> Unit, scan: () -> Unit, openCamera: () -> Unit, studentName: String?) = Row(Modifier.fillMaxWidth().background(Color.White).padding(horizontal = 20.dp, vertical = 12.dp), verticalAlignment = Alignment.CenterVertically) {
    OutlinedTextField(value = value, onValueChange = update, modifier = Modifier.weight(1f), singleLine = true, leadingIcon = { Icon(Icons.Default.QrCodeScanner, null, tint = Blue) }, label = { Text("Scan or enter code") }, placeholder = { Text("STU1001, ASM201, or ITM104") })
    Spacer(Modifier.width(10.dp)); IconButton(onClick = openCamera, modifier = Modifier.size(56.dp)) { Icon(Icons.Default.QrCodeScanner, "Scan with camera", tint = Blue) }; Button(onClick = scan, modifier = Modifier.height(56.dp)) { Text("Process") }
    if (studentName != null) { Spacer(Modifier.width(12.dp)); AssistChip(onClick = {}, label = { Text(studentName, maxLines = 1, overflow = TextOverflow.Ellipsis) }, leadingIcon = { Icon(Icons.Default.CreditCard, null) }) }
}

@Composable
private fun BarcodeCameraDialog(onDismiss: () -> Unit, onBarcode: (String) -> Unit) {
    val context = LocalContext.current
    val lifecycleOwner = LocalLifecycleOwner.current
    val previewView = remember { PreviewView(context) }
    val scanner = remember { BarcodeScanning.getClient() }
    val hasScanned = remember { AtomicBoolean(false) }
    val mainExecutor = remember { ContextCompat.getMainExecutor(context) }

    DisposableEffect(lifecycleOwner) {
        val providerFuture = ProcessCameraProvider.getInstance(context)
        val listener = Runnable {
            val provider = providerFuture.get()
            val preview = Preview.Builder().build().also { it.surfaceProvider = previewView.surfaceProvider }
            val analyzer = ImageAnalysis.Builder()
                .setBackpressureStrategy(ImageAnalysis.STRATEGY_KEEP_ONLY_LATEST)
                .build()
            analyzer.setAnalyzer(mainExecutor) { imageProxy ->
                val image = imageProxy.image
                if (image == null || hasScanned.get()) {
                    imageProxy.close()
                } else {
                    scanner.process(InputImage.fromMediaImage(image, imageProxy.imageInfo.rotationDegrees))
                        .addOnSuccessListener { codes ->
                            val code = codes.firstOrNull { !it.rawValue.isNullOrBlank() }?.rawValue
                            if (code != null && hasScanned.compareAndSet(false, true)) onBarcode(code)
                        }
                        .addOnCompleteListener { imageProxy.close() }
                }
            }
            provider.unbindAll()
            provider.bindToLifecycle(lifecycleOwner, CameraSelector.DEFAULT_BACK_CAMERA, preview, analyzer)
        }
        providerFuture.addListener(listener, mainExecutor)
        onDispose {
            scanner.close()
            if (providerFuture.isDone) providerFuture.get().unbindAll()
        }
    }

    Dialog(onDismissRequest = onDismiss) {
        Card(Modifier.fillMaxWidth(), colors = CardDefaults.cardColors(containerColor = Color.White)) {
            Column(Modifier.padding(16.dp)) {
                Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween, verticalAlignment = Alignment.CenterVertically) {
                    Column { Text("Scan a class code", fontWeight = FontWeight.Bold, fontSize = 18.sp); Text("Hold a barcode or QR code inside the frame.", fontSize = 13.sp, color = Color(0xFF5B687A)) }
                    IconButton(onClick = onDismiss) { Icon(Icons.Default.Close, "Close camera scanner") }
                }
                Spacer(Modifier.height(12.dp))
                AndroidView(factory = { previewView }, modifier = Modifier.fillMaxWidth().aspectRatio(0.78f))
            }
        }
    }
}

@Composable private fun Dashboard(students: List<Student>, assignments: List<Assignment>, inventory: List<StoreItem>, logs: List<ScanEvent>, navigate: (Screen) -> Unit) = Page {
    Header("Classroom at a glance", "Grade 5A | Oakridge Academy")
    val completed = assignments.sumOf { it.doneBy.size }; val possible = assignments.size * students.size
    Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(12.dp)) {
        Metric("Students", students.size.toString(), Blue, Modifier.weight(1f)) { navigate(Screen.Roster) }
        Metric("Avg. points", (students.sumOf { it.points } / students.size).toString(), Gold, Modifier.weight(1f)) { navigate(Screen.Store) }
        Metric("Completion", "${if (possible == 0) 0 else completed * 100 / possible}%", Mint, Modifier.weight(1f)) { navigate(Screen.Assignments) }
    }
    SectionTitle("Class leaders")
    students.sortedByDescending { it.points }.take(3).forEachIndexed { index, student -> LeaderRow(index + 1, student) }
    SectionTitle("Recent scanner activity")
    if (logs.isEmpty()) EmptyState("No scans yet", "Use the scanner bar to select students, record work, redeem items, or award rewards.")
    else logs.take(5).forEach { log -> LogRow(log) }
    SectionTitle("Inventory")
    Text("${inventory.sumOf { it.stock }} rewards available across ${inventory.size} catalog items.", color = Color(0xFF5B687A))
}

@Composable private fun Roster(students: List<Student>, activeId: String?, select: (String) -> Unit, adjust: (Student, Int) -> Unit) = Page {
    Header("Roster & student cards", "Select a learner to make them active for the store.")
    students.forEach { student -> Card(Modifier.fillMaxWidth().padding(vertical = 5.dp).clickable { select(student.id) }, colors = CardDefaults.cardColors(containerColor = if (student.id == activeId) Color(0xFFE7EFFF) else Color.White)) {
        Row(Modifier.padding(16.dp), verticalAlignment = Alignment.CenterVertically) { Icon(Icons.Default.Groups, null, tint = Blue); Spacer(Modifier.width(12.dp)); Column(Modifier.weight(1f)) { Text(student.name, fontWeight = FontWeight.Bold); Text("${student.id} | Grade ${student.grade}", fontSize = 12.sp, color = Color.Gray) }; Text("${student.points} pts", color = Gold, fontWeight = FontWeight.Bold); IconButton(onClick = { adjust(student, -5) }) { Icon(Icons.Default.Close, "Remove 5 points") }; IconButton(onClick = { adjust(student, 5) }) { Icon(Icons.Default.Add, "Add 5 points") } }
    } }
}

@Composable private fun Assignments(assignments: List<Assignment>, students: List<Student>, activeId: String, select: (String) -> Unit) = Page {
    Header("Assignments", "Choose an assignment, then scan student cards to mark completion.")
    assignments.forEach { task ->
        val active = task.id == activeId
        Card(Modifier.fillMaxWidth().padding(vertical = 5.dp).clickable { select(task.id) }, colors = CardDefaults.cardColors(containerColor = if (active) Color(0xFFE5F5F1) else Color.White)) {
            Row(Modifier.padding(16.dp), verticalAlignment = Alignment.CenterVertically) { Icon(if (active) Icons.Default.CheckCircle else Icons.AutoMirrored.Filled.Assignment, null, tint = if (active) Mint else Blue); Spacer(Modifier.width(12.dp)); Column(Modifier.weight(1f)) { Text(task.name, fontWeight = FontWeight.Bold); Text("${task.subject} | ${task.reward} point reward", fontSize = 12.sp, color = Color.Gray) }; Text("${task.doneBy.size}/${students.size}", color = Mint, fontWeight = FontWeight.Bold) }
        }
    }
}

@Composable private fun Store(items: List<StoreItem>, activeStudent: Student?, redeem: (StoreItem) -> Unit) = Page {
    Header("Class Store", activeStudent?.let { "Active shopper: ${it.name} (${it.points} pts)" } ?: "Scan a student card before redeeming an item.")
    items.forEach { item -> Card(Modifier.fillMaxWidth().padding(vertical = 5.dp), colors = CardDefaults.cardColors(containerColor = Color.White)) { Row(Modifier.padding(16.dp), verticalAlignment = Alignment.CenterVertically) { Icon(Icons.Default.Redeem, null, tint = Gold); Spacer(Modifier.width(12.dp)); Column(Modifier.weight(1f)) { Text(item.name, fontWeight = FontWeight.Bold); Text("${item.category} | ${item.stock} left | ${item.id}", fontSize = 12.sp, color = Color.Gray) }; Button(onClick = { redeem(item) }, enabled = item.stock > 0) { Text("${item.cost} pts") } } } }
}

@Composable private fun Rewards(rewards: List<Reward>, activeId: String, select: (String) -> Unit, students: List<Student>, award: (Student) -> Unit) = Page {
    Header("Rewards Hub", "Choose a reward, then tap or scan a student to award it.")
    Row(horizontalArrangement = Arrangement.spacedBy(8.dp), modifier = Modifier.fillMaxWidth()) { rewards.forEach { reward -> FilterChip(selected = reward.id == activeId, onClick = { select(reward.id) }, label = { Text("${reward.name} +${reward.points}") }, leadingIcon = { Icon(Icons.Default.Star, null) }) } }
    Spacer(Modifier.height(12.dp)); SectionTitle("Award selected reward")
    students.forEach { student -> FilledTonalButton(onClick = { award(student) }, modifier = Modifier.fillMaxWidth().padding(vertical = 3.dp)) { Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) { Text(student.name); Text("${student.points} pts") } } }
}

@Composable private fun Reports(students: List<Student>, assignments: List<Assignment>, logs: List<ScanEvent>) = Page {
    Header("Class reports", "Live summary for the active classroom.")
    val possible = students.size * assignments.size; val completed = assignments.sumOf { it.doneBy.size }
    Metric("Work completion", "${if (possible == 0) 0 else completed * 100 / possible}%", Mint, Modifier.fillMaxWidth()) {}
    SectionTitle("Student points")
    students.sortedByDescending { it.points }.forEachIndexed { index, student -> LeaderRow(index + 1, student) }
    SectionTitle("Scan health")
    Text("${logs.count { it.success }} successful actions and ${logs.count { !it.success }} items needing attention this session.", color = Color(0xFF5B687A))
}

@Composable private fun Page(content: @Composable androidx.compose.foundation.layout.ColumnScope.() -> Unit) = LazyColumn(contentPadding = PaddingValues(20.dp), verticalArrangement = Arrangement.spacedBy(8.dp), modifier = Modifier.fillMaxSize()) { item { Column(content = content) } }
@Composable private fun Header(title: String, subtitle: String) = Column(Modifier.padding(bottom = 8.dp)) { Text(title, fontSize = 26.sp, fontWeight = FontWeight.Black, color = Navy); Text(subtitle, color = Color(0xFF5B687A), fontSize = 14.sp) }
@Composable private fun SectionTitle(value: String) = Text(value, fontWeight = FontWeight.Bold, fontSize = 18.sp, color = Ink, modifier = Modifier.padding(top = 14.dp, bottom = 4.dp))
@Composable private fun Metric(label: String, value: String, color: Color, modifier: Modifier, action: () -> Unit) = Card(modifier.clickable { action() }, colors = CardDefaults.cardColors(containerColor = Color.White)) { Column(Modifier.padding(16.dp)) { Text(label, fontSize = 12.sp, color = Color.Gray); Text(value, color = color, fontWeight = FontWeight.Black, fontSize = 25.sp) } }
@Composable private fun LeaderRow(position: Int, student: Student) = Row(Modifier.fillMaxWidth().padding(vertical = 8.dp), verticalAlignment = Alignment.CenterVertically) { Text("#$position", color = Blue, fontWeight = FontWeight.Bold, modifier = Modifier.width(42.dp)); Text(student.name, modifier = Modifier.weight(1f), fontWeight = FontWeight.Medium); Text("${student.points} pts", color = Gold, fontWeight = FontWeight.Bold) }
@Composable private fun LogRow(event: ScanEvent) = Row(Modifier.fillMaxWidth().padding(vertical = 7.dp), verticalAlignment = Alignment.CenterVertically) { Icon(if (event.success) Icons.Default.CheckCircle else Icons.AutoMirrored.Filled.List, null, tint = if (event.success) Mint else Gold); Spacer(Modifier.width(10.dp)); Column { Text(event.title, fontWeight = FontWeight.Bold, fontSize = 13.sp); Text(event.detail, fontSize = 12.sp, color = Color(0xFF5B687A)) } }
@Composable private fun EmptyState(title: String, detail: String) = Card(Modifier.fillMaxWidth(), colors = CardDefaults.cardColors(containerColor = Color.White)) { Column(Modifier.padding(20.dp)) { Text(title, fontWeight = FontWeight.Bold); Text(detail, color = Color(0xFF5B687A), fontSize = 13.sp) } }