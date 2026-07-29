package com.k12.classscanner

import android.content.Context
import androidx.room.Dao
import androidx.room.Database
import androidx.room.Entity
import androidx.room.Insert
import androidx.room.OnConflictStrategy
import androidx.room.PrimaryKey
import androidx.room.Query
import androidx.room.Room
import androidx.room.RoomDatabase

@Entity(tableName = "classroom_snapshot")
data class ClassroomSnapshot(
    val json: String,
    val updatedAt: Long = System.currentTimeMillis(),
    @PrimaryKey
    val id: Int = 1
)

@Dao
interface ClassroomSnapshotDao {
    @Query("SELECT * FROM classroom_snapshot WHERE id = 1")
    suspend fun get(): ClassroomSnapshot?

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun save(snapshot: ClassroomSnapshot)
}

@Database(entities = [ClassroomSnapshot::class], version = 1, exportSchema = false)
abstract class ClassScannerDatabase : RoomDatabase() {
    abstract fun snapshots(): ClassroomSnapshotDao

    companion object {
        @Volatile private var instance: ClassScannerDatabase? = null

        fun get(context: Context): ClassScannerDatabase = instance ?: synchronized(this) {
            instance ?: Room.databaseBuilder(
                context.applicationContext,
                ClassScannerDatabase::class.java,
                "classscanner.db"
            ).build().also { instance = it }
        }
    }
}